library(plumber)
library(lwgeom)
library(geojsonsf)
library(sf)
library(jsonlite)

#* @param geojson GeoJson to process
#* @get /version
function() {
  "GRT version 1.0.0"
}

#* @param geojson GeoJson to process
#* @post /mbc
function(geojson=NULL) {
  polygon.sf <- geojson_sf(geojson)
  # Minimum bounding circle
  mbc <- st_minimum_bounding_circle(polygon.sf, nQuadSegs = 30)
  mbc.json = sf_geojson(mbc)
  
  # Radius
  radius <- (st_bbox(mbc)$xmax - st_bbox(mbc)$xmin)/2
  
  # Centre
  xc <- as.numeric(st_bbox(mbc)$xmin + radius)
  yc <- as.numeric(st_bbox(mbc)$ymin + radius)
  centre <- st_sfc(st_point(c(xc, yc))) %>% st_set_crs(4326) %>% st_as_sf(.)
  centre.json <- sf_geojson(centre)
  
  l <- list(mbc=mbc.json, centre=centre.json, radius=radius)
  toJSON(l)
}

