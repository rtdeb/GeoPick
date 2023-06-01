library(plumber)
library(jsonlite)
library(sf)
library(geojsonsf)
library(lwgeom)
library(terra)
library(mapview)

source("R/functions.R")

wkt <- "POLYGON ((-23.054936 66.451887, -24.526915 65.503854, -23.77994 64.746017, -22.681449 63.821288, -18.70491 63.391522, -14.9261 64.225493, -13.410182 65.146115, -14.552613 66.416748, -16.332169 66.557007, -20.440527 66.098268, -21.385229 66.035873, -23.054936 66.451887))"
site.sf <- st_as_sf(st_as_sfc(wkt)) %>% st_set_crs(4326)
print(as.character(st_bbox(site.sf)))
res <- fromJSON(getGeoreference(site.sf, 10000, 10))



centroid <- geojson_sf(res$centroid)
centroid <- paste(as.character(round(st_coordinates(centroid), 7)), collapse = ", ")


cat(paste0("AEQD parameters: +lat_0=", round(res$xc, 7), " +lon_0=", round(res$yc, 7)), "\n")
cat(paste("centroid:", centroid, "Uncertainty:", as.character(res$uncertainty)))

            