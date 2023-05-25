point <- st_as_sf(st_sfc(st_point(c(8, 43)))) %>% st_set_crs(4326)

if(is.na(as.integer(st_intersects(site, point)))){
  p.nearest <- st_nearest_points(site, point)
  p.nearest <- st_sfc(st_cast(p.nearest, "POINT")[[1]]) %>% st_set_crs(4326)
}




site.vx <- st_cast(site, "POINT")
distances <- st_distance(site.vx, p.nearest)
idx.furthest <- which.max(distances)
radius <- as.double(distances[idx.furthest])
p.furthest <- site.vx[idx.furthest,]

plot(rc)
plot(circle, add=T)
plot(site, add=T)
plot(point, add = T, col = "red", pch=19)
plot(p.nearest, add = T, col = "blue", pch= 19)
plot(p.furthest, add = T, col = "green", pch= 19)

xc <- st_coordinates(p.nearest)[1]
yc <- st_coordinates(p.nearest)[2]
x1 <- st_coordinates(p.furthest)[1]
y1 <- st_coordinates(p.furthest)[2]

xc <- 0
yc <- 0
x1 <- 2
y1 <- 2
r <- x1 - xc
rad2deg <- function(rad) {(rad * 180) / (pi)}
at <- atan((y1 - yc)/(x1 - xc))
at
alpha <- rad2deg(at)
alpha

xc + r * cos(3.141593)
yc + r * sin(alpha)

# fu.co <- as.vector(st_coordinates(p.furthest))
# ne.co <- as.vector(st_coordinates(p.nearest))
# xd <- ne.co[1]-fu.co[1]
# yd <- ne.co[2]-fu.co[2]
# op.co <- c(ne.co[1] + xd, ne.co[2] + yd)
# p3 <- st_point(op.co)
# 
# plot(p.furthest, add=T)
# plot(p.nearest, add=T)
# plot(p3, add=T)


# plot(site.vx, add=T)
# p.nearest.3857 <- st_transform(p.nearest, crs = "EPSG:3857")
# circle.3857 <- st_buffer(p.nearest.3857, dist = radius, endCapStyle = "ROUND")
# circle <- st_transform(circle.3857, crs = "EPSG:4326")
# r.3857 <- project(r, "EPSG:4326")

plot(r)
plot(p.nearest, add=T)
plot(circle, add=T)
st_write(circle, "tmp/kk1.shp", append = F)

plot(r.3857)
plot(p.nearest.3857, add=T)
plot(circle.3857, add=T)
st_write(circle, "tmp/kk1.shp", append = F)

# par(mfrow=c(1,2))
r <- rast("tmp/wc2.1_10m_elev.tif")
# plotResult(r, site, mbc, centre, p1, p2, l1, l2)

par(mfrow=c(1,1))
rc <- crop(r, ext(-15, 25, 25, 60))

plot(rc)
plot(circle, add=T)
plot(site, add=T)
plot(point, add = T, col = "red", pch=19)
plot(p.nearest, add = T, col = "blue", pch= 19)
plot(p.furthest, add = T, col = "green", pch= 19)


st_write(circle, "tmp/kk1.shp", append=F)
p1 <- as(p.nearest, "Spatial")
pb <- gBuffer(p1, width = 2)
plot(p1)
plot(pb, add=T)

# library(dismo)
# emory <- gmap("Bishopsgate, London", zoom = 14, scale = 2)
# d <- data.frame(lat = c(51.51594), lon = c(-0.08248))
# coordinates(d) <- ~ lon + lat
# projection(d) <- "+init=epsg:4326"
# 
# mm <- "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs"
# d_mrc <- spTransform(d, CRS = CRS(mm))
# 
# # Buffer creation
# d_mrc_bff <- gBuffer(d_mrc, width = 1000)
# library(scales) # for `alpha()` function
# 
# plot(emory)
# plot(d_mrc_bff, col = alpha("red", .35))
# points(d_mrc, cex = 2, pch = 20)

plot.new()


slice <- 2 * pi / 8;
radius <- 5
  for(i in 1:8){
    angle  <-  slice * i
    x <- xc + radius * cos(angle)
    y <- yc + radius * sin(angle)
    p = paste(c(rad2deg(angle), x, y) )
    print(p)
 plot(p, add=T)
  }

