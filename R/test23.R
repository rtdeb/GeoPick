library(plumber)
library(lwgeom)
library(geojsonsf)
library(sf)
library(jsonlite)
library(terra)
library(stringr)
library(mapview)
library(geosed)

source("R/test_data_2.R")
source("R/functions.R")
max_points_polygon <- 10000


site.sf <- st_as_sf(st_as_sfc(japan.wkt)) %>% st_set_crs(4326)

centroid <- st_centroid(site.sf)
xc <- st_coordinates(centroid)[1]
yc <- st_coordinates(centroid)[2]
# crs <- paste0("+proj=laea +lat_0=", yc, " +lon_0=", xc, 
#               " +x_0=4321000 +y_0=3210000 +ellps=GRS80 ", 
#               "+towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs")

res <- fromJSON(getGeoreference(site.sf, 10000, 500))

par(mfrow=c(1,2))
r <- rast("tmp/wc2.1_10m_tavg_11.tif")
r <- crop(r, ext(xc - 45, xc + 45, yc - 25, yc + 25))

r.tr <- terra::project(r, crs)
plot(r.tr)

plot(geojson_sf(res$mbc.tr), add = T)
plot(geojson_sf(res$site.tr), add = T)
plot(geojson_sf(res$centre.tr), add = T)


site <- geojson_sf(res$site)

mbc <- geojson_sf(res$mbc)
centre <- geojson_sf(res$centre)

plot(r)
plot(mbc, add = T)
plot(site, add = T)
plot(centre, add = T)

leaflet() %>% 
  addTiles() %>% 
  addGeoJSON(res$mbc) %>% 
  addGeoJSON(res$site) %>% 
  addGeoJSON(res$centre) %>% 
  addMouseCoordinates() %>% 
  addMeasure(primaryLengthUnit = "kilometers") %>% 
  setView(lng = xc, lat = yc, zoom = 3)
