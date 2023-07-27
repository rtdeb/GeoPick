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
source("R/sites.R")

max_points_polygon <- 10000
tolerance <- 500
n.sample <- 50
n.nearest <- 10

test.site <- site.0
site.sf <- st_as_sf(st_as_sfc(test.site, crs = 4326))

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
