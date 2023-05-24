wkt <- 'MULTIPOLYGON (((30 20, 45 40, 10 40, 30 20)),
((15 5, 40 10, 10 20, 5 10, 15 5)))'
wkt <- 'LINESTRING (-3 30, 12 40)'
wkt <- 'MULTILINESTRING ((-3 30, 12 40),(12 40, 25 75), (25 75, 30 30), (30 30, -3 30))'
wkt <- 'LINESTRING (-70 70, 53 30)'
wkt <- 'MULTILINESTRING ((-70 70, 53 30), (53 30, -70 -30))'
site.sf <- st_set_crs(st_as_sf(st_as_sfc(wkt)), 4326)
centroid <- st_centroid(site.sf)
xc <- st_coordinates(centroid)[1]
yc <- st_coordinates(centroid)[2]
crs <- paste0("+proj=laea +lat_0=", yc, " +lon_0=", xc, 
              " +x_0=4321000 +y_0=3210000 +ellps=GRS80 ", 
              "+towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs")
segment <- site.sf %>% st_transform(crs)
st_coordinates(segment)
if(st_geometry_type(segment)[1] == "MULTILINESTRING" | st_geometry_type(segment)[1] == "POLYGON"){
  segment <- st_cast(segment, "LINESTRING")
} else if(st_geometry_type(segment)[1] == "MULTIPOLYGON") {
  segment <- st_cast(st_cast(site.sf, "POLYGON"), "LINESTRING") 
}
processed.site <- NULL
for(i in 1:length(st_geometry(segment))){
  seg <- st_geometry(segment)[i]
  ipc <- st_coordinates(seg)[1, 1:2]
  fpc <- st_coordinates(seg)[2, 1:2]
  if(fpc[1] >= ipc[1]){
    dx <- fpc[1] - ipc[1]  
  } else {
    dx <- ipc[1] - fpc[1]
  }
  
  dy <- fpc[2] - ipc[2]
  rad <- as.numeric(set_units(atan(dy/dx), "radians"))
  h <- sqrt(dx^2 + dy^2)
  df <- data.frame(cbind(x=ipc[1], y=ipc[2]))
  for(i in 1:n){
    xt <- ipc[1] + i*(h/n)*cos(rad)
    yt <- ipc[2] + i*(h/n)*sin(rad)
    df <- rbind(df, cbind(x=xt, y=yt))
    df
  }
  df$x <- as.numeric(df$x)
  df$y <- as.numeric(df$y)
  
  ls <- st_as_sf(st_sfc(st_linestring(as.matrix(df)))) %>% st_set_crs(st_crs(segment))
  processed.site <- rbind(processed.site, ls %>% st_transform(4326))
}
res <- st_as_sf(st_combine(processed.site))
par(mfrow = c(1,2))
# r <- rast("tmp/wc2.1_10m_tavg_11.tif")
# r <- crop(r, ext(-10, 40, 20, 80))
# rp <- project(r, crs)
plot(rp)
plot(segment, add = T)
# plot(r)
# plot(site.sf, add = T)
plot(r)
plot(res, add = T)
