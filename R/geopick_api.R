library(plumber)
library(lwgeom)
library(geojsonsf)
library(sf)
library(jsonlite)
library(terra)
library(stringr)

#* @filter cors
cors <- function(res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "*")
  res$setHeader("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept")
  plumber::forward()
}

#* @options /mbc
options <- function() {}

#* @options /version
options <- function() {}


#* @get /version
function() {
  "GeoPick API version 1.0.0"
}

# NOTE: MULTILINESTRINGS do not work. 
# There seems to be a bug in geojsonsf_2.0.3 and if type is 'MULTILINESTRING' it gives 
# error <Rcpp::exception in rcpp_geojson_to_sf(geojson, expand_geometries): unknown sfg type>
# Until we can resolve this issue, sites as multiple lines are not supported
#* @post /mbc
function(req) {
  site.geojson <- toJSON(req$body)
  site.sf <- geojson_sf(site.geojson)
  epsg.tr <- 3857

  # transform to a projection so that the mbc is done correctly, if not, lat/long
  # are used as planar coordinates and the mbc is not calculated correctly
  site.tr <- st_transform(site.sf, epsg.tr)
  mbc.tr <- st_minimum_bounding_circle(site.tr, nQuadSegs = 30)
  
  # Determine center
  radius.tr <- (st_bbox(mbc.tr)$xmax - st_bbox(mbc.tr)$xmin)/2
  xc <- st_bbox(mbc.tr)$xmin + radius.tr
  yc <- st_bbox(mbc.tr)$ymin + radius.tr
  pc <- st_point(c(xc, yc))
  pc.tr.sf <- st_as_sf(st_sfc(pc)) %>% st_set_crs(epsg.tr)
  
  # Displace point if centroid outside site
  if(is.na(as.integer(st_intersects(site.tr, pc.tr.sf)))){
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

  # Transform mbc back to wgs8
  mbc.4326 <- st_transform(mbc.tr, 4326)
  mbc.json <- sf_geojson(mbc.4326)
  
  # Radius/Uncertainty
  radius <- as.double(st_distance(pc.tr.sf, pw))
  
  # Centre
  centre <- st_as_sf(pc.tr.sf) %>% st_transform(4326)
  centre.json <- sf_geojson(centre)
  pe <- pe %>% st_transform(4326)
  pw <- pw %>% st_transform(4326)
  ps <- ps %>% st_transform(4326)
  pn <- pn %>% st_transform(4326)
  l <- list(mbc=mbc.json, site=site.geojson, centre=centre.json, uncertainty=radius,
            pe=sf_geojson(pe), pn=sf_geojson(pn), pw=sf_geojson(pw), ps=sf_geojson(ps))
  
  response <- toJSON(l)
  response
}


