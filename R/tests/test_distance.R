crs <- "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs "

library(sf)
x1 <- 174.81
y1 <- -41.32
x2 <- -5.50
y2 <- 40.96
p1 <- c(x1, y1)
p2 <- c(x2, y2)
p1 <- st_point(p1)
p2 <- st_point(p2)
p1 <- st_as_sf(st_sfc(p1)) %>% st_set_crs(4326)
p2 <- st_as_sf(st_sfc(p2)) %>% st_set_crs(4326)
cat("Distances\n")
cat("  ", st_distance(p1,p2)/1000, " (sf package)\n")

library(sp)

p1 <- SpatialPoints(coords = cbind(x1, y1), proj4string = CRS(crs))
p2 <- SpatialPoints(coords = cbind(x2, y2), proj4string = CRS(crs))
cat("  ", spDistsN1(p1, p2, longlat = TRUE), " (sp package)\n")

cat("   19970.00 (https://www.movable-type.co.uk/scripts/latlong.html)\n")
cat("   19954.00 (https://www.nhc.noaa.gov/gccalc.shtml\n")
cat("   19959.68 (GRASS 7)")

