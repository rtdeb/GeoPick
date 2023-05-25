library(sf)
wkt = "POLYGON ((2.53608 41.832735, 2.634944 41.887966, 2.72557 41.821479, 2.596497 41.720081, 2.53608 41.832735))"

site <- st_as_sf(st_as_sfc(wkt)) %>% st_set_crs(4326)
sf_geojson(site)
