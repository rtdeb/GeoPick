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
  mbc <- st_minimum_bounding_circle(polygon.sf, nQuadSegs = 30)
  kk = '{"name":"John", "age":30, "car":null}'
  output = sf_geojson(mbc)
  l <- list(mbc=mbc, centre=centre, radius=radius)
  toJSON(l)
}

# mbc en geojson
# centre del mbc
# radi del mbc en metres