library(geojsonsf)
library(httr)
library(dplyr)
library(plumber)
library(sf)
library(terra)
library(jsonlite)
library(leaflet)

r <- rast("tmp/wc2.1_10m_elev.tif")
x <- 10 #-2
y <- 47 #40
rc <- crop(r, ext(x - 30, x + 30, y - 30, y + 30))
# POL 1, does not need centroid displacement
# Europe site
df <- data.frame(
  lon = c(2.178, -6.251, 13.001, 19.049, 2.178),
  lat = c(41.397, 53.349, 55.614, 47.525, 41.397)
)
# Greenland site
# df <- data.frame(
#   lon = c(-77, -58, -28, -51, -77),
#   lat = c(78, 75, 76, 79, 78)
# )
# Europe, displaced centroid
df <- data.frame(
  lon = c(4.226,-5.564,-8.610,-5.420,4.659,4.622,-3.990,-6.438,-3.985,4.374,4.226),
  lat = c(47.701,48.397,44.034,38.614,38.457,40.474,40.631,44.219,47.005,46.536,47.701)
)

site.nd <- df %>%
  st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
  summarise(geometry = st_combine(geometry)) %>%
  st_cast("POLYGON")

# POL 2, needs centroid displacement
df <- data.frame(
  lon = c(4.226,-5.564,-8.610,-5.420,4.659,4.622,-3.990,-6.438,-3.985,4.374,4.226),
  lat = c(47.701,48.397,44.034,38.614,38.457,40.474,40.631,44.219,47.005,46.536,47.701)
)
site.d <- df %>%
  st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
  summarise(geometry = st_combine(geometry)) %>%
  st_cast("POLYGON")

# par(mfrow=c(1,2))
# plot(rc)
# plot(site.nd, add=T)
# plot(rc)
# plot(site.d, add=T)

site.geojson <- sf_geojson(site.nd)

# API ======================================================================
# polygon.sf <- geojson_sf(toJSON(req))
epsg.tr <- 3857
site.sf <- geojson_sf(site.geojson)

# transform to a projection so that the mbc is done correctly, if not, lat/long
# are used as planar coordinates and the mbc is not calculated correctly
site.tr <- st_transform(site.sf, epsg.tr)
mbc.tr <- st_minimum_bounding_circle(site.tr, nQuadSegs = 30)

# Determine center
radius.tr <- (st_bbox(mbc.tr)$xmax - st_bbox(mbc.tr)$xmin)/2
xc <- st_bbox(mbc.tr)$xmin + radius.tr
yc <- st_bbox(mbc.tr)$ymin + radius.tr
pc <- st_point(c(xc, yc))
pc.tr.sf <- st_as_sf(st_sfc(pc)) %>% st_set_crs(epsg.tr)

# Displace point if centroid outside site
if(is.na(as.integer(st_intersects(site.tr, pc.tr)))){
  pc.tr.sf <- st_nearest_points(site.tr, pc.tr.sf)
  pc.tr.sf <- st_sfc(st_cast(pc.tr.sf, "POINT")[[1]]) %>% st_set_crs(epsg.tr)
  site.p <- st_cast(site.tr, "POINT")
  distances <- st_distance(site.p, pc.tr.sf)
  idx.furthest <- which.max(distances)
  radius <- as.double(distances[idx.furthest])
  p.furthest <- site.p[idx.furthest,]
  mbc.tr <- st_as_sf(terra::buffer(vect(pc.tr.sf), radius))
} 

# Determine four cardinal points in circle (just for testing purposes)
x1.tr <- st_bbox(mbc.tr)$xmin
x2.tr <- st_bbox(mbc.tr)$xmax
y1.tr <- st_bbox(mbc.tr)$ymin
y2.tr <- st_bbox(mbc.tr)$ymax

pe <- st_point(c(x1.tr, yc))
pw <- st_point(c(x2.tr, yc))
ps <- st_point(c(xc, y1.tr))
pn <- st_point(c(xc, y2.tr))
test.points <- st_as_sf(st_sfc(st_multipoint(c(pe, pn, pw, ps)))) %>% 
  st_set_crs(epsg.tr) %>% 
  st_transform(., 4326)
points.json <- sf_geojson(test.points)

# Transform mbc back to wgs84
mbc.4326 <- st_transform(mbc.tr, 4326)
mbc.json <- sf_geojson(mbc.4326)

# Radius/Uncertainty
radius <- st_distance(pc, pw)

# Centre
centre <- st_as_sf(pc.tr.sf) %>% st_transform(4326)
centre.json <- sf_geojson(centre)

l <- list(mbc=mbc.json, site=site.geojson, centre=centre.json, uncertainty=radius,
          test.points=points.json)

# END API ==================================================================
mbc <- geojson_sf(l$mbc)
site <- geojson_sf(l$site)
centre <- geojson_sf(l$centre)
test.points <- geojson_sf(l$test.points)
plot(rc)
plot(site, add=T)
plot(mbc, add=T)
plot(centre, col = "red", add=T)
plot(test.points, add=T)

st_write(site.sf, "tmp/site.shp", append = F)
st_write(mbc, "tmp/mbc.shp", append = F)
st_write(centre, "tmp/centre.shp", append = F)
st_write(test.points, "tmp/test.points.shp", append = F)




# x1 <- st_bbox(mbc.3857)$xmin
# x2 <- st_bbox(mbc.3857)$xmax
# xc <- x1 + (x2 - x1)/2
# 
# y1 <- st_bbox(mbc.3857)$ymin
# y2 <- st_bbox(mbc.3857)$ymax
# yc <- y1 + (y2 - y1)/2
# 
# gp1 <- st_as_sf(st_sfc(st_point(c(x1, y1)))) %>% 
#   st_set_crs(3857) %>% 
#   st_transform(., 4326)
# gp2 <- st_as_sf(st_sfc(st_point(c(x2, y2)))) %>% 
#   st_set_crs(3857) %>% 
#   st_transform(., 4326)
# gp1
# gp2
# st_distance(gp1, gp2)/2
# 
# mlat <- st_bbox(mbc.4326)$ymin + (st_bbox(mbc.4326)$ymax - st_bbox(mbc.4326)$ymin)/2
# p1 <- c(st_bbox(mbc.4326)$xmin, mlat)
# p2 <- c(st_bbox(mbc.4326)$xmax, mlat)
# p1
# p2
# distHaversine(p1, p2)
# 
# mlon <- st_bbox(mbc.4326)$xmin + (st_bbox(mbc.4326)$xmax - st_bbox(mbc.4326)$xmin)/2
# p1 <- c(mlon, st_bbox(mbc.4326)$ymin)
# p2 <- c(mlon, st_bbox(mbc.4326)$xmax)
# p1
# p2``
# distHaversine(p1, p2)
# 
# (x2 - x1)/2

