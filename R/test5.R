r <- rast("tmp/wc2.1_10m_elev.tif")
par(mfrow=c(1,2))
rc <- crop(r, ext(-65, -30, 55, 80))
sf_use_s2(T)
p1 <- st_as_sf(st_sfc(st_point(c(-50,70)))) %>% st_set_crs(4326)
b1 <- st_buffer(p1, dist=units::set_units(205, km))
plot(rc, main="BUFFER")
plot(p1, add=T)
plot(b1, add=T)

b1.co <- data.frame(st_coordinates(b1))
cat("# BUFFER =========================================\n")
cat("xmin=",min(b1.co$X), ", xmax=", max(b1.co$X), 
    ", ymin=", min(b1.co$Y), ", ymax=", max(b1.co$Y), "\n", sep = "")
cat("dif_x=", max(b1.co$X) - min(b1.co$X), ", dif_y=", max(b1.co$Y) - min(b1.co$Y), "\n\n",sep="")
st_write(b1, "tmp/b1.shp", append = F, quiet=T)


cat("# MBC 4326 =========================================\n")  
df <- data.frame(lon = c(max(b1.co$X), min(b1.co$X)), lat = c(70, 70))
point_1 <- df %>%
  st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
  summarise(geometry = st_combine(geometry)) %>%
  st_cast("MULTIPOINT")
mbc <- st_minimum_bounding_circle(point_1, nQuadSegs = 30)
plot(rc, main="MBC")
plot(mbc, add=T)
plot(point_1, add=T)

mbc.co <- data.frame(st_coordinates(mbc))
cat("xmin=",min(mbc.co$X), ", xmax=", max(mbc.co$X), 
    ", ymin=", min(mbc.co$Y), ", ymax=", max(mbc.co$Y), "\n", sep = "")
cat("dif_x=", max(mbc.co$X) - min(mbc.co$X), ", dif_y=", max(mbc.co$Y) - min(mbc.co$Y), "\n\n", sep="")
st_write(mbc, "tmp/mbc.shp", append = F, quiet=T)

cat("# MBC 3857 =========================================\n")  

mbc.3857 <- st_transform(mbc, 3857)
mbc.3857.co <- data.frame(st_coordinates(mbc.3857))
cat("xmin=",min(mbc.3857.co$X), ", xmax=", max(mbc.3857.co$X), 
    ", ymin=", min(mbc.3857.co$Y), ", ymax=", max(mbc.3857.co$Y), "\n", sep = "")
cat("dif_x=", max(mbc.3857.co$X) - min(mbc.3857.co$X), ", dif_y=", max(mbc.3857.co$Y) - min(mbc.3857.co$Y), sep="")
st_write(mbc.3857, "tmp/mbc_3857.shp", append = F, quiet=T)
