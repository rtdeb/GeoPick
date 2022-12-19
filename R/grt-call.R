library(geojsonsf)
library(httr)
library(dplyr)
library(plumber)
library(sf)
library(terra)

getVersion <- function(){
  req <- httr::GET("http://127.0.0.1:8000/version")
  response <- httr::content(req)
  return(response[[1]])
}

getMBC <- function(obj.geojson){
  req <- httr::POST("http://127.0.0.1:8000/mbc",
                    body = list(geojson = obj.geojson), 
                    encode = "json")
  response <- httr::content(req)
  return(response[[1]])
}

# POLYGONS EXAMPLE
df <- data.frame(
  name = c("Barcelona", "Dublin", "Malmö", "Budapest", "Barcelona"),
  lon = c(2.178, -6.251, 13.001, 19.049, 2.178),
  lat = c(41.397, 53.349, 55.614, 47.525, 41.397)
)
obj.sf <- df %>%
  st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
  summarise(geometry = st_combine(geometry)) %>%
  st_cast("POLYGON")
obj.geojson <- sf_geojson(obj.sf)

# LINES EXAMPLE
# df <- data.frame(
#   name = c("Barcelona", "Dublin", "Malmö"),
#   lon = c(2.178, -6.251, 13.001),
#   lat = c(41.397, 53.349, 55.614)
# )
# obj.sf <- df %>%
#   st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
#   summarise(geometry = st_combine(geometry)) %>%
#   st_cast("MULTILINESTRING")
# obj.geojson <- sf_geojson(obj.sf)

# POINTS EXAMPLE
df <- data.frame(
  name = c("Barcelona", "Dublin", "Malmö", "Budapest", "Lisbon", "Oslo"),
  lon = c(2.178, -6.251, 13.001, 19.049, -9.142685, 10.752245),
  lat = c(41.397, 53.349, 55.614, 47.525, 38.736946, 59.913868)
)
obj.sf <- df %>%
  st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
  summarise(geometry = st_combine(geometry)) %>%
  st_cast("MULTIPOINT")
obj.geojson <- sf_geojson(obj.sf)

# Print version
cat(getVersion())

# Get minimum bounding circle
mbc <- geojson_sf(fromJSON(getMBC(obj.geojson))$output)
json <- getMBC(obj.geojson)

# Plot result, WGS84
r <- rast("tmp/HYP_50M_SR/HYP_50M_SR.tif")
rc <- terra::crop(r, ext(-12, 25, 30, 65))
par(mfrow=c(1,2))
plot(rc)
plot(obj.sf, add=T)
plot(mbc, add=T)

# Reproject to 3857 and plot result
rc.mc <- project(rc, "epsg:3857")
obj.sf.mc <- st_transform(obj.sf, crs = "epsg:3857")
mbc.mc <- geojson_sf(getMBC(sf_geojson(obj.sf.mc)))
plot(rc.mc)
plot(obj.sf.mc, add=T)
plot(mbc.mc, add=T)



