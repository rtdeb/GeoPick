r <- rast("tmp/wc2.1_2.5m_tavg_12.tif")
r <- crop(r, ext(-10, 45, 30, 85))
cp <- st_sfc(st_point(c(9.5360875, 62.5123179))) %>% st_set_crs(4326)
cp.tr <- cp %>% st_transform(3857)
r.tr <- terra::project(r, "epsg:3857")
plot(r.tr)


alta <- st_sfc(st_point(c(23.25, 70.00))) %>% st_set_crs(4326)
vilnius <- st_sfc(st_point(c(25.22, 54.71))) %>% st_set_crs(4326)

londres <- st_sfc(st_point(c(0.10, 51.54))) %>% st_set_crs(4326)
berlin <- st_sfc(st_point(c(13.4, 52.53))) %>% st_set_crs(4326)
alta.tr <- alta %>% st_transform(3857)
vilnius.tr <- vilnius %>% st_transform(3857)
londres.tr <- londres %>% st_transform(3857)
berlin.tr <- berlin %>% st_transform(3857)

du <- (st_coordinates(berlin.tr)[2] - st_coordinates(londres.tr)[2])
dist <- st_distance(londres, berlin)/1000
# 3857 ration units to km
dux
distx
dux/distx

plot(londres.tr, add=T)
plot(berlin.tr, add=T)

duy <- (st_coordinates(alta.tr)[2] - st_coordinates(riga.tr)[2])/1000
disty <- st_distance(vilnius, alta)/1000
duy
disty
duy/disty


plot(vilnius.tr, add=T)
plot(alta.tr, add=T)


# ~ 1000 km ==============================================================================
# In 26 dd longitude
p1 <- st_sfc(st_point(c(1, 70.00))) %>% st_set_crs(4326)
p2 <- st_sfc(st_point(c(27, 70))) %>% st_set_crs(4326)
st_distance(p1, p2)
# Difference in units in 3857
st_coordinates(st_transform(p2, 3857))[2] - st_coordinates(st_transform(p1, 3857))[2]

# In 9 dd latitude
p1 <- st_sfc(st_point(c(27, 58))) %>% st_set_crs(4326)
p2 <- st_sfc(st_point(c(27, 67))) %>% st_set_crs(4326)
st_distance(p1, p2)
# Difference in units in 3857
st_coordinates(st_transform(p2, 3857))[2] - st_coordinates(st_transform(p1, 3857))[2]

# ~ 1 km ==============================================================================
# In 26 dd longitude
p1 <- st_sfc(st_point(c(11, 70))) %>% st_set_crs(4326)
p2 <- st_sfc(st_point(c(1.027, 70))) %>% st_set_crs(4326)

# Difference in units in 3857
st_coordinates(st_transform(p2, 3857))[2] - st_coordinates(st_transform(p1, 3857))[2]

# In 9 dd latitude
p1 <- st_sfc(st_point(c(27, 67))) %>% st_set_crs(4326)
p2 <- st_sfc(st_point(c(27, 67.009))) %>% st_set_crs(4326)
st_distance(p1, p2)
# Difference in units in 3857
st_coordinates(st_transform(p2, 3857))[2] - st_coordinates(st_transform(p1, 3857))[2]



# Change in longitude by latitude
lo <- 0
  for(la in seq(0, 80, 10)){
    p1 <- st_sfc(st_point(c(lo, la))) %>% st_set_crs(4326)
    p2 <- st_sfc(st_point(c(lo + 0.1, la))) %>% st_set_crs(4326)
    xy1 <- paste(st_coordinates(p1)[1], st_coordinates(p1)[2])
    xy2 <- paste(st_coordinates(p2)[1], st_coordinates(p2)[2])
    d <- st_distance(p1, p2) %>% as.numeric()/1000

    p1.tr <- st_transform(p1, "+proj=moll +lon_0=0 +x_0=0 +y_0=0")
    p2.tr <- st_transform(p2, "+proj=moll +lon_0=0 +x_0=0 +y_0=0")
    xy1.tr <- paste(st_coordinates(p1.tr)[1], st_coordinates(p1.tr)[2])
    xy2.tr <- paste(st_coordinates(p2.tr)[1], st_coordinates(p2.tr)[2])
    # dx.tr <- st_coordinates(p2.tr)[1] - st_coordinates(p1.tr)[1]
    dx.tr <- st_distance(p1.tr, p2.tr)
    s <- paste0(xy1, " to ", xy2, ": ", round(d,1))
    cat(s, "\n")
    s <- paste0(xy1.tr, " to ", xy2.tr, ": ", round(dx.tr,1), "\n")
    cat(s, "\n")
  }

p1 <- st_sfc(st_point(c(0, 80))) %>% st_set_crs(4326)
p2 <- st_sfc(st_point(c(58, 80))) %>% st_set_crs(4326)
st_distance(p1, p2)/1000
p1 <- st_sfc(st_point(c(0, 90))) %>% st_set_crs(4326)
p2 <- st_sfc(st_point(c(0, 70))) %>% st_set_crs(4326)
st_distance(p1, p2)/1000


p1 <- st_sfc(st_point(c(0, 80))) %>% st_set_crs(4326)
p2 <- st_sfc(st_point(c(1, 80))) %>% st_set_crs(4326)
st_distance(p1, p2)/1000

p1 <- st_sfc(st_point(c(0, 18000000))) %>% st_set_crs(3857)
p2 <- st_sfc(st_point(c(100000, 18000000))) %>% st_set_crs(3857)
st_distance(p1, p2)/1000

p <- c(0, 0)
map <- leaflet() %>% 
  addTiles() %>% 
  # addMarkers(lng = p[1], lat = p[2]) %>% 
  addCircles(lng = p[1], lat = p[2], radius = 1000000) %>% 
  addCircles(lng = p[1], lat = p[2] + 20, radius = 1000000) %>%
  addCircles(lng = p[1], lat = p[2] + 40, radius = 1000000) %>%
  addCircles(lng = p[1], lat = p[2] + 60, radius = 1000000) %>%
  addCircles(lng = p[1], lat = p[2] + 80, radius = 1000000) %>% 
  setView(lng = p[1], lat = p[2], zoom = 1) %>% 
  addGraticule(sphere = T) %>% 
  
  addMeasure(primaryLengthUnit = "kilometers")
map


r <- rast("tmp/wc2.1_2.5m_tavg_12.tif")
r <- crop(r, ext(-10, 30, -10, 90))
plot(r)
p1 <- st_sfc(st_point(c(0, 80))) %>% st_set_crs(4326)
p2 <- st_sfc(st_point(c(1, 80))) %>% st_set_crs(4326)
plot(p1, add = T)
plot(p2, add = T)
st_distance(p1,p2)/1000
p1 <- st_sfc(st_point(c(0, 0))) %>% st_set_crs(4326)
p2 <- st_sfc(st_point(c(1, 0))) %>% st_set_crs(4326)
plot(p1, add = T)
plot(p2, add = T)
st_distance(p1,p2)/1000


r <- rast("tmp/wc2.1_2.5m_tavg_12.tif")
r.tr <- terra::project(r, "epsg:54009")
plot(r.tr)
zoom(r.tr)
p1 <- st_sfc(st_point(c(0, 18000000))) %>% st_set_crs(3857)
p2 <- st_sfc(st_point(c(100000, 18000000))) %>% st_set_crs(3857)
plot(p1, add = T)
plot(p2, add = T)
st_coordinates(p2)[1]-st_coordinates(p1)[1]
p1 <- st_sfc(st_point(c(0, 0))) %>% st_set_crs(3857)
p2 <- st_sfc(st_point(c(100000, 0))) %>% st_set_crs(3857)
plot(p1, add = T)
plot(p2, add = T)
st_distance(p1,p2)
st_coordinates(p2)[1]-st_coordinates(p1)[1]

library(maps)
library(maptools)

data(wrld_simpl)
plot(spTransform(wrld_simpl, CRS = ("+proj=moll +lon_0=0 +x_0=0 +y_0=0")))

p1 <- st_sfc(st_point(c(0, 80))) %>% st_set_crs(4326) %>% st_transform("+proj=moll +lon_0=0 +x_0=0 +y_0=0")
p1
