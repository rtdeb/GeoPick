library(ggmap)
library(ggplot2)
library(sf)

r <- rast("tmp/wc2.1_10m_elev.tif")
sf_use_s2(FALSE)
par(mfrow=c(1,2))
x <- -50
y <- 70
d <- 30
p1 <- st_as_sf(st_sfc(st_point(c(x,y)))) %>% st_set_crs(4326)
b1 <- st_buffer(p1, units::set_units(10, degree), nQuadSegs = 6, 
                endCapStyle = "ROUND", joinStyle = "ROUND")
b1 <- st_make_valid(b1)
rc1 <- crop(r, ext(x - d, x + d, y - d, y + d))
plot(rc1)
plot(p1, add=T)
plot(b1, add=T)

r <- rast("tmp/wc2.1_10m_elev.tif")
sf_use_s2(TRUE)
b1 <- st_buffer(p1, units::set_units(10, degree), nQuadSegs = 6, 
                endCapStyle = "ROUND", joinStyle = "ROUND")
b1 <- st_make_valid(b1)
plot(rc1)
plot(p1, add=T)
plot(b1, add=T)

p2 <- st_transform(p1, 3857)
b2 <- st_transform(b1, 3857)

plot(r)
plot(p2, add=T)
plot(b2, add=T)

st_write(b, "tmp/b1.shp", append = F)
st_write(p1, "tmp/p1.shp", append = F)
leaflet() %>% 
  addTiles() %>% 
  addPolygons(data=b)
  



library(sf)
#> Warning: package 'sf' was built under R version 3.5.3
#> Linking to GEOS 3.6.1, GDAL 2.2.3, PROJ 4.9.3
library(mapview)
#> Warning: package 'mapview' was built under R version 3.5.3

data("breweries")

test_coords <- st_geometry(breweries[1:2,])
# st_crs(test_coords)
#> Coordinate Reference System:
#>   EPSG: 4326 
#>   proj4string: "+proj=longlat +datum=WGS84 +no_defs"
p1 <- st_as_sf(st_sfc(st_point(c(0,42)))) %>% st_set_crs(4326)
buff_test_coords <- st_buffer(p1, dist = 3000000)
#> Warning in st_buffer.sfc(test_coords, dist = 2): st_buffer does not correctly
#> buffer longitude/latitude data
#> dist is assumed to be in decimal degrees (arc_degrees).

#Buffering non-projected coords
mapview(p1) + mapview(buff_test_coords)



leaflet() %>% 
  addTiles() %>% 
  addPolygons(data = buff_test_coords)

plot(r)
plot(buff_test_coords, add=T)
plot(buff_test_coords)
world <- ne_countries(scale = "medium", returnclass = "sf")
class(world)

# =============
v <- vect(cbind(0, seq(0, 80, 15)), crs="+init=EPSG:4326")
b <- buffer(v, 1100000)
plot(b, asp=1, border=rainbow(8), lwd=2)
points(v)

# =============
# packages
library(sf)
#> Linking to GEOS 3.9.1, GDAL 3.2.1, PROJ 7.2.1
library(terra)
#> terra version 1.4.11

# data
point_sf <- st_as_sfc("POINT (0 50)", crs="+init=EPSG:4326")
point_terra <- vect("POINT (0 50)", crs="+init=EPSG:4326")

# buffer
buffer_sf <- st_buffer(point_sf, dist = 1000000)
buffer_terra <- buffer(point_terra, width = 1000000)

# plot
plot(r)
plot(point_sf, add = T)
plot(buffer_sf, axes = TRUE,  add=T)
plot(buffer_terra, border = "red", add = TRUE, lwd = 3.5)


plot(site)
plot(st_centroid(site), add=T)
