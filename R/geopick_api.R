library(plumber)
library(lwgeom)
library(geojsonsf)
library(sf)
library(jsonlite)
library(terra)
library(stringr)
library(mapview)
library(geosed)

df.env <- read.table("../.env", sep = "=") %>% setNames(., c("var","value"))

allow_origin <- df.env[df.env$var == "ALLOW_ORIGIN", "value"]
allow_methods <- df.env[df.env$var == "ALLOW_METHODS", "value"]
if(length(df.env[df.env$var == "MAX_PTS_PER_POLYGON", "value"]) == 0){
  max_points_polygon <- 10000
} else {
  max_points_polygon <- as.integer(df.env[df.env$var == "MAX_PTS_PER_POLYGON", "value"])
}
if(length(df.env[df.env$var == "TOLERANCE", "value"]) == 0){
  tolerance <- 500 # default value
} else {
  tolerance <- as.double(df.env[df.env$var == "TOLERANCE", "value"])
}

#* @filter cors
cors <- function(res) {
  res$setHeader("Access-Control-Allow-Origin", allow_origin)
  res$setHeader("Access-Control-Allow-Methods", allow_methods)
  res$setHeader("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept, Authorization")
  plumber::forward()
}

#* @options /mbc
options <- function() {}

#* @options /version
options <- function() {}


#* @get /version
function() {
  "GeoPick API 1.0.2023-Beta"
}

#* @post /mbc
function(req) {
  site.geojson <- toJSON(req$body, digits = NA)
  
  site.sf <- geojson_sf(site.geojson)

  site.sf <- site.sf %>% summarise(geometry = st_combine(geometry))
  epsg.tr <- 3857
  
  # need to transform to a projection so that the mbc is done correctly, if not, lat/long
  # are used as planar coordinates and the mbc is not calculated correctly
  site.tr <- st_transform(site.sf, epsg.tr)

  # Check if polygon is too large, if it has more than 10000 points. If so we 
  # simplify with a tolerance of 500 meters
  if(npts(site.tr) > as.integer(max_points_polygon)){
    site.tr <- st_simplify(site.tr, preserveTopology = TRUE, dTolerance = tolerance)
  }
  # Finally, calculate the minimum bounding circle
  mbc.tr <- st_minimum_bounding_circle(site.tr, nQuadSegs = 30)
  
  # Determine center
  radius.tr <- (st_bbox(mbc.tr)$xmax - st_bbox(mbc.tr)$xmin)/2
  xc <- st_bbox(mbc.tr)$xmin + radius.tr
  yc <- st_bbox(mbc.tr)$ymin + radius.tr
  pc <- st_point(c(xc, yc))
  pc.tr.sf <- st_as_sf(st_sfc(pc)) %>% st_set_crs(epsg.tr)
  
  # Displace point if centroid outside site
  if(is.na(as.integer(st_intersects(site.tr, pc.tr.sf)))){
    print("Point displaced")
    pc.tr.sf <- st_nearest_points(site.tr, pc.tr.sf)
    pc.tr.sf <- st_sfc(st_cast(pc.tr.sf, "POINT")[[1]]) %>% st_set_crs(epsg.tr)
    site.p <- st_cast(site.tr, "POINT")
    distances <- st_distance(site.p, pc.tr.sf)
    idx.furthest <- which.max(distances)
    radius <- as.double(distances[idx.furthest])
    p.furthest <- site.p[idx.furthest,]
    mbc.tr <- st_as_sf(terra::buffer(vect(pc.tr.sf), radius))
  }

  # Determine four cardinal points in circle (just for testing purposes)
  x1.tr <- st_bbox(mbc.tr)$xmin
  x2.tr <- st_bbox(mbc.tr)$xmax
  y1.tr <- st_bbox(mbc.tr)$ymin
  y2.tr <- st_bbox(mbc.tr)$ymax
  
  pw <- st_as_sf(st_sfc(st_point(c(x1.tr, st_coordinates(pc.tr.sf)[2])))) %>% st_set_crs(epsg.tr)
  pe <- st_as_sf(st_sfc(st_point(c(x2.tr, st_coordinates(pc.tr.sf)[2])))) %>% st_set_crs(epsg.tr)
  ps <- st_as_sf(st_sfc(st_point(c(st_coordinates(pc.tr.sf)[1], y1.tr)))) %>% st_set_crs(epsg.tr)
  pn <- st_as_sf(st_sfc(st_point(c(st_coordinates(pc.tr.sf)[1], y2.tr)))) %>% st_set_crs(epsg.tr)

  # Transform mbc back to wgs84
  mbc.4326 <- st_transform(mbc.tr, 4326)
  mbc.json <- sf_geojson(mbc.4326)
  
  # Radius/Uncertainty
  radius <- as.double(st_distance(pc.tr.sf, pw))
  
  # Spatial fit
  spatial.fit <- round(radius^2 * pi / as.double(st_area(site.tr)), 3)
  
  # Centre
  centre <- st_as_sf(pc.tr.sf) %>% st_transform(4326)
  centre.json <- sf_geojson(centre)
  pe <- pe %>% st_transform(4326)
  pw <- pw %>% st_transform(4326)
  ps <- ps %>% st_transform(4326)
  pn <- pn %>% st_transform(4326)
    
  # Return not as multipolygon or multilinestring since leaflet does not support
  # multipolygon or multilinestring for editing.
  site.sf <- st_transform(site.tr, 4326)
  if(st_geometry_type(site.sf) == "MULTIPOLYGON"){
    site.sf <- st_cast(site.sf, "POLYGON")
  } else if(st_geometry_type(site.sf) == "MULTILINESTRING"){
    site.sf <- st_cast(site.sf, "LINESTRING")
  }
  
  site.gj <- sf_geojson(site.sf, simplify = F)
  
  l <- list(mbc=mbc.json, site=site.gj, spatial_fit=spatial.fit,
            centre=centre.json, uncertainty=radius,
            pe=sf_geojson(pe), pn=sf_geojson(pn), pw=sf_geojson(pw), ps=sf_geojson(ps))
  
  response <- toJSON(l, digits = NA)
  response
}
