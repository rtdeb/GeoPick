library(geosed)
require(mapview)
require(sp)
library(leaflet)
# Create sample geo dataset

p1 <- st_sfc(st_point(c(3.17, 55.98))) %>% st_set_crs(4326)
p2 <- st_sfc(st_point(c(23.25, 70.00))) %>% st_set_crs(4326)
 
p1.tr <- p1 %>% st_transform(3857)
p2.tr <- p2 %>% st_transform(3857)
coords <- rbind(st_coordinates(p1.tr), st_coordinates(p2.tr))


# Generate sed center and radius
gsc <- geo_sed(coords)
print(gsc)
  # Create 80 sided polygon based on gsc's center and radius
gsc_circle <- geo_surround_poly(gsc$center, gsc$radius, 36)
gsc_circle <- rbind(gsc_circle, gsc_circle[1,])
circle <- st_polygon(x = list(gsc_circle[, 1:2]))

# Join all the points into a single matrix
bound_circle <- rbind(coords, gsc$center, gsc_circle)
circle.sf <- st_as_sf(as.data.frame(bound_circle), coords = c(1,2)) %>% st_set_crs(32662) %>% 
  st_transform(4326)
plot(circle.sf)

circle.coords = st_coordinates(circle.sf)
map <- leaflet(circle.sf) %>% 
  addTiles() %>% 
  addMarkers()
  addPolylines(lng=coords[,1], lat=coords[,2]) %>% 
  # addGeoJSON(sf_geojson(site)) %>% 
  addMarkers(lng=gsc$center[1], lat=gsc$center[2]) %>% 
  addMeasure(primaryLengthUnit = "kilometers", primaryAreaUnit = "sqmeters")
map


p1 <- st_sfc(st_point(c(3.17, 55.98))) %>% st_set_crs(4326)
p2 <- st_sfc(st_point(c(23.25, 70.00))) %>% st_set_crs(4326)
st_distance(p1, p2)/1000
