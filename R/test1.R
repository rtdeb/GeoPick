library(lwgeom)
library(dplyr)
library(terra)
library(leaflet)
library(plumber)
library(geojsonsf)
library(sf)
library(jsonlite)

mbc <- function(geojson) {
  polygon.sf <- geojson_sf(geojson)
  mbc <- st_minimum_bounding_circle(polygon.sf, nQuadSegs = 30)
  kk = '{"name":"John", "age":30, "car":null}'
  output = sf_geojson(mbc)
  output
}

df <- data.frame(
  lon = c(2, 2, 4, 4, 2),
  lat = c(40, 42, 42, 40, 40)
)

df <- data.frame(
  lon = c(2, 2, 40, 40, 2),
  lat = c(40, 80, 80, 40, 40)
)

df <- data.frame(
  lon = c(2, 2, 42, 42, 2),
  lat = c(30, 70, 70, 30, 30)
)

df <- data.frame(
  lon = c(2, 4, 8, 6, 2),
  lat = c(42, 44, 46, 44, 42)
)

df <- data.frame(
  lon = c(2.178, -6.251, 13.001, 19.049, 2.178),
  lat = c(1.397, 13.349, 15.614, 7.525, 1.397)
)

df <- data.frame(
  name = c("Barcelona", "Dublin", "Malmö", "Budapest", "Barcelona"),
  lon = c(2.178, -6.251, 13.001, 19.049, 2.178),
  lat = c(41.397, 53.349, 55.614, 47.525, 41.397)
)

pol_1 <- df %>%
  st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
  summarise(geometry = st_combine(geometry)) %>%
  st_cast("POLYGON")
mbc_1 <- st_minimum_bounding_circle(pol_1, nQuadSegs = 30)
radius <- (st_bbox(mbc_1)$xmax - st_bbox(mbc_1)$xmin)/2
xc <- as.numeric(st_bbox(mbc_1)$xmin + radius)
yc <- as.numeric(st_bbox(mbc_1)$ymin + radius)
centre_1 <- st_sfc(st_point(c(xc, yc))) %>% st_set_crs(4326)

dfl1 <- data.frame(lon = c(xc, xc + radius), lat = c(yc, yc))
radius_1 <- dfl1 %>%
  st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
  summarise(geometry = st_combine(geometry)) %>%
  st_cast("LINESTRING")
dfl2 <- data.frame(lon = c(xc, xc), lat = c(yc, yc + radius))
radius_2 <- dfl2 %>%
  st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
  summarise(geometry = st_combine(geometry)) %>%
  st_cast("LINESTRING")

par(mfrow=c(1,2))
r <- rast("tmp/wc2.1_10m_elev.tif")
plot(r)
# plot(mbc_1)
plot(pol_1, add=T)
plot(mbc_1, add=T)
plot(centre_1, add=T)
# zoom(r)
rc <- crop(r, ext(-65, 50, 30, 85))
plot(rc)
plot(pol_1, add=T)
plot(mbc_1, add=T)
plot(centre_1, add=T)
plot(radius_1, add=T)
plot(radius_2, add=T)
st_write(pol_1, "tmp/pol_1.shp", append = F)
st_write(mbc_1, "tmp/mbc_1.shp", append = F)
st_write(centre_1, "tmp/centre_1.shp", append = F)
st_write(radius_1, "tmp/radius_1.shp", append = F)
st_write(radius_2, "tmp/radius_2.shp", append = F)
leaflet() %>% 
  addTiles() %>% 
  addMarkers(lng=xc, lat=yc) %>% 
  addPolygons(data = pol_1) %>% 
  addPolygons(data = mbc_1)


