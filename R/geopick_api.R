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

getGeoreference <- function(site.sf){
  
  site.sf <- site.sf %>% summarise(geometry = st_combine(geometry))
  
  # Get Centroid to determine parameters for projecting to LAEA 
  centroid <- st_centroid(site.sf)
  xc <- st_coordinates(centroid)[1]
  yc <- st_coordinates(centroid)[2]
  crs <- paste0("+proj=laea +lat_0=", yc, " +lon_0=", xc, 
                " +x_0=4321000 +y_0=3210000 +ellps=GRS80 ", 
                "+towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs")
  
  # Project site to parameterized LAEA
  site.tr <- site.sf %>% st_transform(crs)
  
  # Check if polygon is too large, if it has more than 10000 points. If so we 
  # simplify with a tolerance of 500 meters
  if(npts(site.tr) > as.integer(max_points_polygon)){
    site.tr <- st_simplify(site.tr, preserveTopology = TRUE, dTolerance = tolerance)
  }
  
  # Calculate MBC and centroid on projected site
  mbc.tr <- st_minimum_bounding_circle(site.tr, nQuadSegs = 30)
  mbc.tr.centroid <- st_centroid(mbc.tr)
  
  # Displace centroid outside site
  if(is.na(as.integer(st_intersects(site.tr, mbc.tr.centroid)))){
    mbc.tr.centroid <- st_nearest_points(site.tr, mbc.tr.centroid)
    mbc.tr.centroid <- st_sfc(st_cast(mbc.tr.centroid, "POINT")[[1]]) %>% st_set_crs(crs)
    site.p <- st_cast(site.tr, "POINT")
    distances <- st_distance(site.p, mbc.tr.centroid)
    idx.furthest <- which.max(distances)
    radius <- as.double(distances[idx.furthest])
    p.furthest <- site.p[idx.furthest,]
    mbc.tr <- st_as_sf(terra::buffer(vect(mbc.tr.centroid), radius))
  }
  
  # Get uncertainty, i.e. from centroid to any point in circle
  p <- st_set_crs(st_as_sf(st_sfc(st_point(st_coordinates(mbc.tr)[1, 1:2]))), crs)
  radius <- st_distance(p, mbc.tr.centroid)
  
  # Calculate spatial fit
  spatial.fit <- round(radius^2 * pi / as.double(st_area(site.tr)), 3)
  
  # Determine four cardinal points in circle (just for testing purposes)
  x1.tr <- st_bbox(mbc.tr)$xmin
  x2.tr <- st_bbox(mbc.tr)$xmax
  y1.tr <- st_bbox(mbc.tr)$ymin
  y2.tr <- st_bbox(mbc.tr)$ymax
  
  pw <- st_as_sf(st_sfc(st_point(c(x1.tr, st_coordinates(mbc.tr.centroid)[2])))) %>% 
    st_set_crs(crs)
  pe <- st_as_sf(st_sfc(st_point(c(x2.tr, st_coordinates(mbc.tr.centroid)[2])))) %>% 
    st_set_crs(crs)
  ps <- st_as_sf(st_sfc(st_point(c(st_coordinates(mbc.tr.centroid)[1], y1.tr)))) %>% 
    st_set_crs(crs)
  pn <- st_as_sf(st_sfc(st_point(c(st_coordinates(mbc.tr.centroid)[1], y2.tr)))) %>% 
    st_set_crs(crs)
  
  # Transform mbc back to wgs84
  mbc.4326 <- st_transform(mbc.tr, 4326)
  mbc.json <- sf_geojson(mbc.4326)
  
  # Centre
  centre <- st_as_sf(mbc.tr.centroid) %>% st_transform(4326)
  centre.json <- sf_geojson(centre)
  pe <- pe %>% st_transform(4326)
  pw <- pw %>% st_transform(4326)
  ps <- ps %>% st_transform(4326)
  pn <- pn %>% st_transform(4326)
  
  # Return not as multipolygon or multilinestring since leaflet does not support
  # multipolygon or multilinestring for editing.
  if(st_geometry_type(site.sf) == "MULTIPOLYGON"){
    site.sf <- st_cast(site.sf, "POLYGON")
  } else if(st_geometry_type(site.sf) == "MULTILINESTRING"){
    site.sf <- st_cast(site.sf, "LINESTRING")
  }
  
  site.gj <- sf_geojson(site.sf, simplify = F)
  # site.sf <- getSegments(site.tr, 10)
  l <- list(mbc=mbc.json, mbc.tr=sf_geojson(centre), 
            site=sf_geojson(site.sf), site.tr=sf_geojson(site.tr),spatial_fit=spatial.fit,
            centre=centre.json, centre.tr=centre.json,
            uncertainty=round(radius),
            pe=sf_geojson(pe), pn=sf_geojson(pn), pw=sf_geojson(pw), ps=sf_geojson(ps))
  
  response <- toJSON(l, force = T, digits = NA)
  response
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
  response <- getGeoreference(site.sf)  
  response
}
