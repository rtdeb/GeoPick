library(sf)
library(units)
library(leaflet)
library(ggplot2)
library(terra)
# install.packages("lwgeom")
library(lwgeom)
library(dplyr)
library(rnaturalearth)
library(patchwork)
# --------------------------------------------------------------------------- #

c1 <- c(2.178498353068539, 41.39681925060133) # Barcelona
c2 <- c(72.89482592702073, 19.082653401331438) # Mumbai
p1 <- st_point(c1) %>% 
  st_coordinates() %>% 
  as.data.frame() %>% 
  st_as_sf(coords = c("X", "Y"), crs = 4326)
p2 <- st_point(c2) %>% 
  st_coordinates() %>% 
  as.data.frame() %>% 
  st_as_sf(coords = c("X", "Y"), crs = 4326)
st_distance(p1,p2) %>% set_units("km")
p1m <- st_transform(p1, crs="epsg:3857")
p2m <- st_transform(p2, crs="epsg:3857")
st_distance(p1m,p2m) %>% set_units("km")

# --------------------------------------------------------------------------- #
df <- data.frame(
  name = c("Barcelona", "Dublin", "Malmö", "Budapest", "Barcelona"),
  lon = c(2.178, -6.251, 13.001, 19.049, 2.178),
  lat = c(41.397, 53.349, 55.614, 47.525, 41.397)
)
polygon <- df %>%
  st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
  summarise(geometry = st_combine(geometry)) %>%
  st_cast("POLYGON")
mbc <- st_minimum_bounding_circle(polygon, nQuadSegs = 30)

r <- rast("tmp/HYP_50M_SR/HYP_50M_SR.tif")
rc <- terra::crop(r, ext(-12, 25, 30, 65))
par(mfrow=c(1,2))
plot(rc)
plot(polygon, add=T)
plot(mbc, add=T)

rc.mc <- project(rc, "epsg:3857")
polygon.mc <- st_transform(polygon, crs = "epsg:3857")
mbc.mc <- st_minimum_bounding_circle(polygon.mc, nQuadSegs = 30)
plot(rc.mc)
plot(polygon.mc, add=T)
plot(mbc.mc, add=T)


world <- ne_countries(scale = "medium", returnclass = "sf")
box <- c(xmin=-35, ymin=60, xmax=25, ymax=80)
p1 <- ggplot() +
  geom_sf(data = world, size = 0.3, fill = "grey70") +
  geom_sf(data = mbc, fill = NA, colour = "blue") +
  geom_sf(data = polygon, fill = NA, colour = "red") +
  scale_x_continuous(limits = c(-35, 60)) +
  scale_y_continuous(limits = c(25, 80)) +
  theme(panel.background = element_blank())


world.mc <- st_transform(world, 3857)
p2 <- ggplot() +
  geom_sf(data = world.mc, size = 0.3, fill = "grey70") +
  geom_sf(data = mbc.mc, fill = NA, colour = "blue") +
  geom_sf(data = polygon.mc, fill = NA, colour = "red") +
  scale_x_continuous(limits = c(-1700000, 8000000)) +
  scale_y_continuous(limits = c(1800000, 14000000)) +
  theme(panel.background = element_blank())

p1 + p2

