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
  radius.dd <- (st_bbox(mbc)$xmax - st_bbox(mbc)$xmin)/2
  
  # Centre
  xc <- as.numeric(st_bbox(mbc)$xmin + radius.dd)
  yc <- as.numeric(st_bbox(mbc)$ymin + radius.dd)
  centre <- st_sfc(st_point(c(xc, yc))) %>% st_set_crs(4326) %>% st_as_sf(.)
  centre.json <- sf_geojson(centre)
  
  # Uncertainty
  x2 <- st_bbox(mbc)["xmax"]
  y2 <- st_bbox(mbc)["ymax"]
  p1 <- st_sfc(st_point(c(xc, yc))) %>% st_set_crs(4326)
  p2 <- st_sfc(st_point(c(x2, y2))) %>% st_set_crs(4326)
  uncertainty <- as.numeric(st_distance(p1, p2))
  
  # p1 and p2 points (only for checking)
  p1 <- st_sfc(st_point(c(xc, yc + radius.dd))) %>% st_set_crs(4326) %>% st_as_sf(.)
  p2 <- st_sfc(st_point(c(xc + radius.dd, yc))) %>% st_set_crs(4326) %>% st_as_sf(.)
  p1.json <- sf_geojson(p1)
  p2.json <- sf_geojson(p2)
  
  l <- list(mbc=mbc.json, centre=centre.json, uncertainty=uncertainty,
            radius=radius.dd, p1 = p1.json, p2 = p2.json)
  toJSON(l)
}



