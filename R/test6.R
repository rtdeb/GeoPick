library(geosphere)

getBuffer <- function(x, y, buf, epsg){
  p <- st_as_sf(st_sfc(st_point(c(x, y)))) %>% st_set_crs(epsg)
  b <- st_buffer(p, dist=units::set_units(buf, km))
  co <- data.frame(st_coordinates(b))
  xmin <- min(co$X)
  xmax <- max(co$X)
  ymin <- min(co$Y)
  ymax <- max(co$Y)
  if(epsg == 4326){
    radius_x <- (distHaversine(cbind(xmin, y), cbind(xmax, y))/2)/1000
    radius_y <- (distHaversine(cbind(x, ymin), cbind(x, ymax))/2)/1000
  } else{
    radius_x <- (xmax - xmin)/2/1000
    radius_y <- (xmax - xmin)/2/1000
  }
  p <- st_as_sf(st_sfc(st_point(c(x,y)))) %>% st_set_crs(epsg)
  list(buffer=b, x=x, y=y, p=p, xmin=xmin, xmax=xmax, ymin=ymin, ymax=ymax, rx=radius_x, ry=radius_y)
}

getMBC <- function(df, type, epsg){
  point_1 <- df %>%
    st_as_sf(coords = c("lon", "lat"), crs = epsg) %>%
    summarise(geometry = st_combine(geometry)) %>%
    st_cast(type)
  mbc <- st_minimum_bounding_circle(point_1, nQuadSegs = 30)
  co <- data.frame(st_coordinates(mbc))
  xmin <- min(co$X)
  xmax <- max(co$X)
  ymin <- min(co$Y)
  ymax <- max(co$Y)
  if(epsg == 4326){
    radius_x <- (distHaversine(cbind(xmin, y), cbind(xmax, y))/2)/1000
    radius_y <- (distHaversine(cbind(x, ymin), cbind(x, ymax))/2)/1000
  } else{
    radius_x <- (xmax - xmin)/1000
    radius_y <- (xmax - xmin)/1000
  }
  p <- st_as_sf(st_sfc(st_point(c(x,y)))) %>% st_set_crs(epsg)
  list(buffer=mbc, x=x, y=y, p=point_1, xmin=xmin, xmax=xmax, ymin=ymin, ymax=ymax, rx=radius_x, ry=radius_y)
}

r <- rast("tmp/wc2.1_10m_elev.tif")
x <- -50
y <- 70
buf <- 200
buf.4326 <- getBuffer(x,y,buf,4326)
buf.4326
st_write(buf.4326$buffer, "tmp/buf-4326.shp", appennd=F)
x <- -5565975 
y <- 11068716
buf.3857 <- getBuffer(x,y,buf,3857)
buf.3857
buf.4326.t <- st_transform(buf.3857$buffer, 4326)
st_write(buf.3857$buffer, "tmp/buf-3857.shp", append=F)
st_write(buf.4326.t, "tmp/buf-4326-t.shp", append=F)
st_write(st_transform(buf.4326$p, 3857), "tmp/p.shp", append=F)

p.00.3857 <- st_transform(st_as_sf(st_sfc(st_point(c(0,0)))) %>% st_set_crs(4326), 3857)
st_write(p.00.3857, "tmp/p-00-3857.shp", append=F)
# 4326
rc <- crop(r, ext(-65, -30, 55, 80))
plot(rc, main="BUFFER")
plot(buf.4326$p, add=T)
plot(buf.4326$buffer, add=T)

# 3857
rc.3857 <- terra::project(rc, "EPSG:3857")
plot(rc.3857, main="BUFFER")
plot(buf.3857$p, add=T)
plot(buf.3857$buffer, add=T)
xmax <- max(data.frame(st_coordinates(buf.3857$buffer))$X)
xmin <- min(data.frame(st_coordinates(buf.3857$buffer))$X)
(xmax-xmin)/2/1000



df <- data.frame(lon = c(buf.4326$xmin, buf.4326$xmax), lat = c(buf.4326$y, buf.4326$y))
mbc <- getMBC(df, "MULTIPOINT", 4326)
mbc
plot(rc, main="MBC")
plot(mbc$p, add=T)
plot(mbc$buffer, add=T)

df <- data.frame(lon = c(buf.3857$xmin, buf.3857$xmax), lat = c(buf.3857$y, buf.3857$y))
mbc <- getMBC(df, "MULTIPOINT", 3857)
mbc
plot(rc.3857, main="MBC")
plot(mbc$p, add=T)
plot(mbc$buffer, add=T)

mbc.4326 <- st_transform(mbc$buffer, 4326)
plot(rc)
plot(mbc.4326, add=T)


par(mfrow=c(1,1))
plot(r)
v <- vect(cbind(-50, seq(0, 80, 10)), crs="+init=EPSG:4326")
b <- buffer(v, 1100000)
plot(b, asp=1, border=rainbow(8), lwd=2, add=T)
points(v)
