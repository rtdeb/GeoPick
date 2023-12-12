library(plumber)
library(jsonlite)
library(sf)
library(geojsonsf)
library(lwgeom)
library(terra)
library(mapview)

source("R/wkt_example_2.R")
source("R/functions.R")

site.sf <- st_as_sf(st_as_sfc(site.wkt, crs = 4326))
site.sf <- st_as_sf(st_combine(site.sf))
getGeoreference(site.sf, 10000, 500, 50, 10)
