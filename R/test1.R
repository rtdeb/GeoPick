library(lwgeom)

mbc <- function(geojson) {
  polygon.sf <- geojson_sf(geojson)
  mbc <- st_minimum_bounding_circle(polygon.sf, nQuadSegs = 30)
  kk = '{"name":"John", "age":30, "car":null}'
  output = sf_geojson(mbc)
  output
}




df <- data.frame(
  name = c("Barcelona", "Dublin", "Malmö", "Budapest", "Barcelona"),
  lon = c(2.178, -6.251, 13.001, 19.049, 2.178),
  lat = c(41.397, 53.349, 55.614, 47.525, 41.397)
)
obj.sf <- df %>%
  st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
  summarise(geometry = st_combine(geometry)) %>%
  st_cast("POLYGON")

geojson <- sf_geojson(obj.sf)

mbc <- mbc(geojson)
mbc.sf <- geojson_sf(mbc)
mbc.sf <- st_set_crs(mbc.sf, 4326)
plot(mbc.sf)


df <- data.frame(
  lon = c(2, 60, 3, 19, 2),
  lat = c(4, 5, 5, 40, 4)
)

df <- data.frame(
lon = c(2.178, 6.251, 13.001, 19.049, 2.178),
lat = c(41.397, 53.349, 55.614, 47.525, 41.397)
)


obj.sf <- df %>%
  # mutate(lon = round(lon), lat = round(lat)) %>% 
  st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
  summarise(geometry = st_combine(geometry)) %>%
  st_cast("POLYGON")

mbc <- st_minimum_bounding_circle(obj.sf, nQuadSegs = 30)
plot(mbc)
plot(obj.sf, add=T)
