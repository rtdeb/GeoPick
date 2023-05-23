library(leaflet)
library(leafem)
library(plumber)
library(lwgeom)
library(geojsonsf)
library(sf)
library(jsonlite)
library(terra)
library(stringr)
library(mapview)
library(geosed)
alta <- st_sfc(st_point(c(23.25, 70.00))) %>% st_set_crs(4326)
edinburgh <- st_sfc(st_point(c(-3.17, 55.98))) %>% st_set_crs(4326)

coords <- matrix(c(-3.17, 55.98, 23.25, 70.00), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(-3.17, 75, 23.25, 85.00), ncol = 2, nrow = 2, byrow = T)
site <- st_sfc(st_linestring(coords)) %>% st_set_crs(4326)
site.tr <- site %>% st_transform("+proj=moll +lon_0=0 +x_0=0 +y_0=0")
site.tr <- site 
site.tr <- site %>% st_transform(3857)

mbc <- st_minimum_bounding_circle(site.tr, nQuadSegs = 30) %>% st_transform(4326)
bbox <- st_bbox(mbc)
center.x <- st_bbox(mbc)[1] + (st_bbox(mbc)[3] - st_bbox(mbc)[1])/2
center.y <- st_bbox(mbc)[2] + (st_bbox(mbc)[4] - st_bbox(mbc)[2])/2
leaflet(mbc) %>% 
  addTiles() %>% 
  addPolylines() %>%
  addMarkers(lng=center.x, lat = center.y) %>% 
  addGeoJSON(sf_geojson(st_as_sf(site))) %>% 
  addMeasure(primaryLengthUnit = "kilometers")


# ================================================================================================ #
coords <- matrix(c(-3.17, 55.98, 23.25, 70.00), ncol = 2, nrow = 2, byrow = T)
site <- st_as_sf(st_sfc(st_linestring(coords))) %>% st_set_crs(4326)
centroid <- st_centroid(site)
xc <- st_coordinates(centroid)[1]
yc <- st_coordinates(centroid)[2]
map <- leaflet() %>% 
  addTiles() %>% 
  addGeoJSON(sf_geojson(centroid)) %>% 
  addGeoJSON(sf_geojson(site)) %>% 
  addMeasure(primaryLengthUnit = "kilometers") %>% 
  setView(lng = xc, lat = yc, zoom = 3)
map
# delta <- 10
crs <- paste0("+proj=laea +lat_0=", yc, " +lon_0=", xc, " +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs")
# crs <- 3857
# r <- rast("tmp/wc2.1_10m_tavg_11.tif")
# r <- crop(r, ext(xc - delta, xc + delta, yc - delta, yc + delta))
# r <- crop(r, ext(-10, 45, 35, 80))
# plot(r)

# r.tr <- terra::project(r, "epsg:3857")
# plot(r.tr)

site.tr <- site %>% st_transform(crs)
mbc <- st_minimum_bounding_circle(site.tr, nQuadSegs = 30) %>% st_transform(4326)
bbox <- st_bbox(mbc)
center.x <- st_bbox(mbc)[1] + (st_bbox(mbc)[3] - st_bbox(mbc)[1])/2
center.y <- st_bbox(mbc)[2] + (st_bbox(mbc)[4] - st_bbox(mbc)[2])/2

map %>% 
  addGeoJSON(sf_geojson(mbc)) %>% 
  addMouseCoordinates() %>% 
  addMeasure(primaryLengthUnit = "kilometers") 
  

