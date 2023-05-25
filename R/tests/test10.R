library(geojsonsf)
library(httr)
library(dplyr)
library(plumber)
library(sf)
library(terra)
library(jsonlite)
library(leaflet)

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
# df <- data.frame(
#   lon = c(4.226,-5.564,-8.610,-5.420,4.659,4.622,-3.990,-6.438,-3.985,4.374,4.226),
#   lat = c(47.701,48.397,44.034,38.614,38.457,40.474,40.631,44.219,47.005,46.536,47.701)
# )

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

site.geojson <- sf_geojson(site.nd)
req <- httr::POST(url = "http://127.0.0.1:8000/mbc", body = site.geojson, encode = "json")
response <- httr::content(req)
response <- fromJSON(response[[1]])
# 
# # response <- fromJSON(kk(sf_geojson(site.nd)))

# site.geojson <- toJSON(req$body)
site.sf <- geojson_sf(site.geojson)
epsg.tr <- 3857

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
if(is.na(as.integer(st_intersects(site.tr, pc.tr.sf)))){
  print("Inside")
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

pe <- st_as_sf(st_sfc(st_point(c(x1.tr, st_coordinates(pc.tr.sf)[2])))) %>% st_set_crs(epsg.tr)
pw <- st_as_sf(st_sfc(st_point(c(x2.tr, st_coordinates(pc.tr.sf)[2])))) %>% st_set_crs(epsg.tr)
ps <- st_as_sf(st_sfc(st_point(c(st_coordinates(pc.tr.sf)[1], y1.tr)))) %>% st_set_crs(epsg.tr)
pn <- st_as_sf(st_sfc(st_point(c(st_coordinates(pc.tr.sf)[1], y2.tr)))) %>% st_set_crs(epsg.tr)

# plot(mbc.tr)
# plot(site.tr, add=T)
# plot(pw, add=T)
# plot(pe, add=T)
# plot(pn, add=T)
# plot(ps, add=T)
# plot(pc.tr.sf, add=T)
# Transform mbc back to wgs8
mbc.4326 <- st_transform(mbc.tr, 4326)
mbc.json <- sf_geojson(mbc.4326)

# Radius/Uncertainty
radius <- as.double(st_distance(pc.tr.sf, pw))

# Centre
centre <- st_as_sf(pc.tr.sf) %>% st_transform(4326)
centre.json <- sf_geojson(centre)
pe <- pe %>% st_transform(4326)
pw <- pw %>% st_transform(4326)
ps <- ps %>% st_transform(4326)
pn <- pn %>% st_transform(4326)
response <- list(mbc=mbc.json, site=site.geojson, centre=centre.json, uncertainty=radius,
          pe=sf_geojson(pe), pn=sf_geojson(pn), pw=sf_geojson(pw), ps=sf_geojson(ps))


plot(geojson_sf(response$mbc))
plot(geojson_sf(response$site), add=T)
plot(geojson_sf(response$pw), add=T)
plot(geojson_sf(response$pe), add=T)
plot(geojson_sf(response$pn), add=T)
plot(geojson_sf(response$ps), add=T)
plot(geojson_sf(response$centre), add=T)

mbc <- geojson_sf(response$mbc)
site <- geojson_sf(response$site)
centre <- geojson_sf(response$centre)
pe <- geojson_sf(response$pe)
pn <- geojson_sf(response$pn)
pw <- geojson_sf(response$pw)
ps <- geojson_sf(response$ps)

# Plot result
# r <- rast("tmp/wc2.1_10m_elev.tif")
# crop.dif <- 25
# rc <- crop(r, ext(st_coordinates(pe)[1] - crop.dif, st_coordinates(pw)[1] + crop.dif, 
#                   st_coordinates(ps)[2] - crop.dif, st_coordinates(pn)[2] + crop.dif))
# plot(rc)
# plot(site, add=T)
# plot(mbc, add=T)
# plot(centre, col = "red", add=T)
# plot(test.points, add=T)
# 
# st_write(site.sf, "tmp/site.shp", append = F)
# st_write(mbc, "tmp/mbc.shp", append = F)
# st_write(centre, "tmp/centre.shp", append = F)
# st_write(test.points, "tmp/test.points.shp", append = F)
# 
# 
