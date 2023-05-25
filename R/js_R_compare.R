library(sf)

wkt = "LINESTRING (0 40, 8 45, 16 40)"
site <- st_as_sf(st_as_sfc(wkt)) %>% st_set_crs(4326)

centroid <- st_centroid(site)

coords.centroid <- round(st_coordinates(centroid))

crs <- paste0("+proj=aeqd +lat_0=", coords.centroid[2], " +lon_0=", coords.centroid[1], " +x_0=0 +y_0=0 +R=6371000 +units=m +no_defs +type=crs")
print(crs)
centroid.tr <- centroid %>% st_transform(3857)
coords.centroid.tr <- st_coordinates(centroid.tr)
print(coords.centroid)
print(coords.centroid.tr)
site.tr <- st_transform(site, 3857)
site.tr.coords <- st_coordinates(site.tr)

print(site.tr.coords)


