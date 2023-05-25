getMBC <- function(req) {
  # polygon.sf <- geojson_sf(toJSON(req$body))
  
  polygon.sf <- geojson_sf(toJSON(req))
  # Minimum bounding circle
  mbc <- st_minimum_bounding_circle(polygon.sf, nQuadSegs = 30)
  mbc.json = sf_geojson(mbc)
  
  # Radius
  radius.dd <- (st_bbox(mbc)$xmax - st_bbox(mbc)$xmin)/2
  
  # Centre
  xc <- as.numeric(st_bbox(mbc)$xmin + radius.dd)
  yc <- as.numeric(st_bbox(mbc)$ymin + radius.dd)
  centre <- st_sfc(st_point(c(xc, yc))) %>% st_set_crs(4326) %>% st_as_sf(.)
  centre.json <- sf_geojson(centre)
  
  # Uncertainty
  x2 <- st_bbox(mbc)["xmax"]
  y2 <- st_bbox(mbc)["ymax"]
  p1 <- st_sfc(st_point(c(xc, yc))) %>% st_set_crs(4326)
  p2 <- st_sfc(st_point(c(x2, y2))) %>% st_set_crs(4326)
  uncertainty <- as.numeric(st_distance(p1, p2))
  
  # p1 and p2 points (only for checking)
  p1 <- st_sfc(st_point(c(xc, yc + radius.dd))) %>% st_set_crs(4326) %>% st_as_sf(.)
  p2 <- st_sfc(st_point(c(xc + radius.dd, yc))) %>% st_set_crs(4326) %>% st_as_sf(.)
  p1.json <- sf_geojson(p1)
  p2.json <- sf_geojson(p2)
  
  l <- list(mbc=mbc.json, centre=centre.json, uncertainty=uncertainty,
            radius=radius.dd, p1 = p1.json, p2 = p2.json)
  toJSON(l)
}

# MBC
x <- 2
y <- 42
buf <- 1000000
r <- rast("tmp/wc2.1_10m_elev.tif")
rc <- crop(r, ext(x - 30, x + 30, y - 30, y + 30))
p.4326 <- st_as_sf(st_sfc(st_point(c(x,y)))) %>% st_set_crs(4326)
# Create buffer
buffer.4326 <- st_as_sf(terra::buffer(vect(p.4326), buf))
st_write(buffer.4326, "tmp/buffer-4326.shp", append=F)

# Two opposed points just to check coincidence between buffer and mbc
xmin <- st_bbox(buffer.4326)["xmin"]
xmax <- st_bbox(buffer.4326)["xmax"]
p1 <- st_point(c(xmin, y))
p2 <- st_point(c(xmax, y))
pts <- st_multipoint(c(p1, p2))
pts.4326 <- st_as_sf(st_sfc(pts)) %>% st_set_crs(4326)               
pts.3857 <- st_transform(pts.4326, 3857)

# Calculate minimum bounding circle with two diameter extremes of buffer
# Calculate in 3857 to get it correctly, 4326 does use lat/long as equirectangular
mbc <- st_minimum_bounding_circle(pts.3857, nQuadSegs = 30)
mbc.4326 <- st_transform(mbc, 4326)
st_write(mbc.4326, "tmp/mbc-4326.shp", append=F)

par(mfrow=c(1,2))
plot(rc, main="MBC")
plot(mbc.4326, add=T)
plot(p.4326, add=T)
plot(pts.4326, add=T)

# BUFFER
plot(rc, main="BUFFER")
plot(buffer.4326, add=T)
plot(p.4326, add=T)
plot(pts.4326, add=T)

