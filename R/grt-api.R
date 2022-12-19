library(plumber)
library(lwgeom)
library(geojsonsf)
library(sf)

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
  list(status = "SUCCESS", code = "200", msg = "Hola", output = sf_geojson(mbc))
}

# mbc en geojson
# centre del mbc
# radi del mbc en metres