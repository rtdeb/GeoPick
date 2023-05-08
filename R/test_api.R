library(geojsonsf)
library(httr)
library(dplyr)
library(plumber)
library(sf)
library(terra)
library(jsonlite)
library(leaflet)

source("R/test_data.R")
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
site.name <- antarctica_2_cd
# site.name <- cardedeu_1_ncd
# site.name <- cardedeu3_1_ncd
crop.dif <- 1 # Air around mbc

site <- site.name %>%
  geojson_sf(.) %>% 
  st_set_crs(4326) %>%  
  summarise(geometry = st_combine(geometry))

# There seems to be a bug in geojsonsf_2.0.3 and if type is 'MULTILINESTRING' it gives 
# error <Rcpp::exception in rcpp_geojson_to_sf(geojson, expand_geometries): unknown sfg type>
# Until we can resolve this issue, sites as multiple lines are not supported
# if(st_geometry_type(site) == "MULTILINESTRING"){
#   site <- st_cast(site, "LINESTRING")
# }

# TEST API ================================================================================== #
# Call API ---------------------------------------------------------------------------------- #
site.geojson <- sf_geojson(site)
req <- httr::POST(url = "http://127.0.0.1:8000/mbc", body = site.geojson, encode = "json")
response <- httr::content(req)
response <- fromJSON(response[[1]])

site.sf <- geojson_sf(site.geojson)

# Plot results ------------------------------------------------------------------------------ #

# Collect results from response
mbc <- geojson_sf(response$mbc)
site <- geojson_sf(response$site)
pw <- geojson_sf(response$pw)
pe <- geojson_sf(response$pe)
pn <- geojson_sf(response$pn)
ps <- geojson_sf(response$ps)
xmin <- st_coordinates(pw)[1]
xmax <- st_coordinates(pe)[1]
ymin <- st_coordinates(ps)[2]
ymax <- st_coordinates(pn)[2]
centre <- geojson_sf(response$centre)

print(site)
print(sf_geojson(site))
# Plot
r <- rast("tmp/wc2.1_10m_elev.tif")
rc <- crop(r, ext(xmin - crop.dif, xmax + crop.dif, ymin - crop.dif, ymax + crop.dif))
# plot(rc)
# plot(mbc, add=T)
plot(mbc)
plot(site, add=T)
plot(pw, add=T)
plot(pe, add=T)
plot(pn, add=T)
plot(ps, add=T)
plot(centre, add=T)
print(response$uncertainty)
# zoom(rc)


# Orto, cardedeu, test for cardedeu_1_ncd
rc <- rast("docs/ortos/of5mtif1683476493971.tif")

# rc <- crop(rc, ext(446600, 446750, 4610770, 4610870))
rc <- crop(rc, ext(446636, 446750, 4610056, 4610204))
r <- terra::project(rc, "EPSG:4326")

plot(r)
plot(site, add=T, colour = "red")
plot(mbc, color = "red", add = T)
plot(centre, add = T)
# zoom(r)

r2 <- terra::project(r, "EPSG:3857")
site2 <- st_transform(site, 3857)
mbc2 <- st_transform(mbc, 3857)
centre2 <- st_transform(centre, 3857)
plot(r2)
plot(site2, add=T, colour = "red")
plot(mbc2, color = "red", add = T)
# zoom(r)

library(raster)
rc <- raster("docs/ortos/of5mtif1683477350081.tif")
rc <- raster::crop(rc, extent(446600, 446750, 4610770, 4610870))
rc <- projectRaster(rc, crs="+init=epsg:3857")
plot(rc)
plot(mbc %>% st_transform(3857), add = T)
plot(site %>% st_transform(3857), add = T)
plot(centre %>% st_transform(3857), add = T)


site.l <- rbind(site,mbc)
site.l <- leaflet(site.l)
site.l <- addTiles(site.l)
map <- 
  addPolygons(site.l) %>%
  addTiles() 
  # addTiles(urlTemplate = "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", attribution = 'Google')
  # addRasterImage(rc)
map

k1 <- sf_geojson(site)
geojson_wkt(k1)
print(site)
