library(plumber)
library(lwgeom)
library(geojsonsf)
library(sf)
library(jsonlite)
library(terra)
library(stringr)
library(mapview)
library(geosed)
source("../R/functions.R")

df.env <- read.table("../.env", sep = "=") %>% setNames(., c("var","value"))

allow_origin <- df.env[df.env$var == "ALLOW_ORIGIN", "value"]
allow_methods <- df.env[df.env$var == "ALLOW_METHODS", "value"]
if(length(df.env[df.env$var == "MAX_PTS_PER_POLYGON", "value"]) == 0){
  max_points_polygon <- 10000
} else {
  max_points_polygon <- as.integer(df.env[df.env$var == "MAX_PTS_PER_POLYGON", "value"])
}
if(length(df.env[df.env$var == "TOLERANCE", "value"]) == 0){
  tolerance <- 500 # default value
} else {
  tolerance <- as.double(df.env[df.env$var == "TOLERANCE", "value"])
}

#* @filter cors
cors <- function(res) {
  res$setHeader("Access-Control-Allow-Origin", allow_origin)
  res$setHeader("Access-Control-Allow-Methods", allow_methods)
  res$setHeader("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept, Authorization")
  plumber::forward()
}

#* @options /mbc
options <- function() {}

#* @options /version
options <- function() {}


#* @get /version
function() {
  "GeoPick API 1.0.2023-Beta"
}

#* @post /mbc
function(req) {
  sf_use_s2(FALSE)
  site.geojson <- toJSON(req$body, digits = NA)
  site.sf <- geojson_sf(site.geojson)
  response <- getGeoreference(site.sf, max_points_polygon, tolerance)  
  response
}
