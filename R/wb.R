# Just a workbench file space ==================================================== #

test.site <- "LINESTRING (0 40, 5 44, 10 45)"
test.site <- "LINESTRING (-45 30, -35 20, -10 40)"
site.sf <- st_as_sf(st_as_sfc(test.site, crs = 4326))
centroid <- st_centroid(site.sf)  
xc <- st_coordinates(centroid)[1]
yc <- st_coordinates(centroid)[2]
crs <- paste0("+proj=aeqd +lat_0=", yc, " +lon_0=", xc, 
              " +x_0=0 +y_0=0 +R=6371000 +units=m +no_defs +type=crs")
site.tr <- site.sf %>% st_transform(crs)
centroid <- st_centroid(site.tr)

np <- st_nearest_points(site.tr, centroid)
np <- st_sfc(st_cast(np, "POINT")[[1]]) %>% st_set_crs(crs)
np <- st_as_sf(np)

centroid.4326 <- st_transform(centroid, 4326)
np.4326 <- st_transform(np, 4326)


p <- ggplot() +
  geom_sf(data = site.tr) +
  geom_sf(data = centroid) +
  geom_sf(data = np, col = "red") +
  theme_void()
plot(p)
p <- ggplot() +
  geom_sf(data = site.sf) +
  geom_sf(data = centroid.4326) +
  geom_sf(data = np.4326, col = "red") +
  theme_void()
plot(p)


plot(site.sf)
plot(centroid.4326, add = T)
plot(np.4326, add = T, col = "red")
print(st_coordinates(np.4326))

plot(site.tr)
plot(centroid, add = T)
plot(np, add = T, col = "red")
print(st_coordinates(np))

library(leaflet)
leaflet() %>% addTiles() %>% 
  addPolylines(data=site.sf) %>% 
  addMarkers(data=centroid.4326) %>% 
  addMarkers(data=np.4326)
