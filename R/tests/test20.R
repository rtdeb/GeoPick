source("R/test_data.R")
library(leaflet)
library(leafem)
library(plumber)
library(lwgeom)
library(geojsonsf)
library(sf)
library(jsonlite)
library(terra)
library(stringr)
library(mapview)
library(geosed)

coords <- matrix(c(75, 55.98, 23.25, 70.00), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(75, -55.98, 23.25, -70.00), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(78, 21, 98, -15), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(45, -25, 18, -33, 51, -66), ncol = 2, nrow = 3, byrow = T)
coords <- matrix(c(32, -78, 119, -70.00), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(-8, 43, 8, 59), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(-8, 43, 8, -59), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(0, -85, 5, 85), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(12.57296, 55.725887, 12.571163, 55.72563, 12.57185, 55.725246, 12.572681, 55.725264, 12.571598, 55.725557, 12.57296, 55.725887), ncol = 2, nrow = 6, byrow = T)
coords <- matrix(c(15.239274, 68.39918, -13.936656, 49.61071, 3.639205, 29.53523, -5.148726, 48.458352, 44.063687, 74.496413, 15.239274, 68.39918), ncol = 2, nrow = 6, byrow = T)
coords <- matrix(c(-3.17, 55.98, 23.25, 70.00), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(-3.17, 55.98, 20, 80.00), ncol = 2, nrow = 2, byrow = T)
# site.name <- china_1_ncd
# site.name <- north_america_1_cd
# site.name <- transect1_lin1_cd
# site.name <- madagascar_2_cd
# site.name <- cap_norfeu_1_cd
# site.name <- africa_1_ncd
# site.name <- points1_pnt3_cd
# site.name <- greenland_pol1_ncd
# site.name <- points2_pnt2_ncd
# site.name <- europe_1_ncd
# site.name <- transect2_lin2_cd # MULTILINESTRING gives error, not supported yet
# site.name <- antarctica_2_cd
# site.name <- cardedeu_1_ncd
# site.name <- cardedeu3_1_ncd
# site.name <- madagascar_2_cd
# site <- site.name %>%
#   geojson_sf(.) %>% 
#   st_set_crs(4326) %>%  
#   summarise(geometry = st_combine(geometry))



site <- st_as_sf(st_sfc(st_linestring(coords))) %>% st_set_crs(4326)
centroid <- st_centroid(site)
xc <- st_coordinates(centroid)[1]
yc <- st_coordinates(centroid)[2]

crs <- paste0("+proj=laea +lat_0=", yc, " +lon_0=", xc, " +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs")

site.tr <- site %>% st_transform(crs)
mbc.tr <- st_minimum_bounding_circle(site.tr, nQuadSegs = 30)
mbc <- mbc.tr %>% st_transform(4326)
mbc.centroid <- st_centroid(mbc)
bbox <- st_bbox(mbc)
center.x <- st_bbox(mbc)[1] + (st_bbox(mbc)[3] - st_bbox(mbc)[1])/2
center.y <- st_bbox(mbc)[2] + (st_bbox(mbc)[4] - st_bbox(mbc)[2])/2

par(mfrow=c(1,2))
r <- rast("tmp/wc2.1_10m_tavg_11.tif")
# r <- crop(r, ext(xc - delta, xc + delta, yc - delta, yc + delta))
r <- crop(r, ext(xc - 45, xc + 45, yc - 25, yc + 25))

centroid.tr <- centroid %>% st_transform(crs)
r.tr <- terra::project(r, crs)
plot(r.tr)
plot(mbc.tr, add = T)
plot(site.tr, add = T)
plot(st_centroid(mbc.tr), add = T)


plot(r)
plot(mbc, add = T)
plot(site, add = T)
plot(mbc.centroid, add = T)

leaflet() %>% 
  addTiles() %>% 
  addGeoJSON(sf_geojson(site)) %>% 
  addMeasure(primaryLengthUnit = "kilometers") %>% 
  addGeoJSON(sf_geojson(mbc)) %>% 
  addGeoJSON(sf_geojson(mbc.centroic)) %>% 
  addMouseCoordinates() %>% 
  addMeasure(primaryLengthUnit = "kilometers") %>% 
  setView(lng = 0, lat = 42, zoom = 3)

# points <- apply(st_coordinates(mbc.tr)[,1:2], 1, FUN=function(x) st_as_sf(st_sfc(st_point(x))) %>% st_set_crs(crs))
# mbc.tr.centroid <- st_centroid(mbc.tr)
# dists <- c()
# for(p in points){
#   d <- st_distance(p, mbc.tr.centroid %>% st_set_crs(crs), which = "Euclidean")
#   cat(st_coordinates(p), "to", st_coordinates(mbc.tr.centroid), "==>", d)
#   d2 <- st_distance(st_transform(p, 4326), mbc.centroid, which = "Great Circle")
#   cat(" [", d2, "]\n", sep = "")
# 
# }
# 
# 
# 
