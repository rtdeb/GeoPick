library(plumber)
library(jsonlite)
library(sf)
library(geojsonsf)
library(lwgeom)
library(terra)
library(mapview)
library(dplyr)
library(ggplot2)
source("R/functions.R")

max_points_polygon <- 10000
tolerance <- 500
n.sample <- 50
n.nearest <- 10

jw <- "LINESTRING (13.164476 -9.324277, 13.164074 -9.324986, 13.16372 -9.325976, 13.163134 -9.328222, 13.162795 -9.329909, 13.162508 -9.331904, 13.163048 -9.334617, 13.162984 -9.335612, 13.162703 -9.336432, 13.162335 -9.337304, 13.162082 -9.338375, 13.162007 -9.339182, 13.161632 -9.340049, 13.161121 -9.340943, 13.160629 -9.341976, 13.160087 -9.342864, 13.158634 -9.344866, 13.157823 -9.346865, 13.157533 -9.346984, 13.157094 -9.346837, 13.157094 -9.347119, 13.156943 -9.347395, 13.155318 -9.348501, 13.153875 -9.348967, 13.152448 -9.348485, 13.150898 -9.347426, 13.150384 -9.346921, 13.149872 -9.346279, 13.148972 -9.344907, 13.148624 -9.344379, 13.148384 -9.343564, 13.147899 -9.34189, 13.147624 -9.340895, 13.14716 -9.340589, 13.14721 -9.339508, 13.146933 -9.338539, 13.146531 -9.337979, 13.14547 -9.337946, 13.145202 -9.337891)"

site.sf <- st_as_sf(st_as_sfc(jw, crs = 4326))

georef <- getGeoreference(site.sf, max_points_polygon, tolerance, n.sample, n.nearest)
georef <- fromJSON(georef)
site <- geojson_sf(georef$site)
mbc <- geojson_sf(georef$mbc)
centroid <- geojson_sf(georef$centroid)
p <- ggplot() +
  geom_sf(data = mbc) +
  geom_sf(data = site) +
  geom_sf(data = centroid) +
  theme_void()
plot(p)
print(georef$uncertainty)
