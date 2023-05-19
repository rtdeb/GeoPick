library(geosed)
require(mapview)
require(sp)
library(leaflet)
# Create sample geo dataset

site <- readRDS("tmp/site_alta-edinburgh.rds")
# site <- readRDS("tmp/site-copenhaguen.rds")
# site <- readRDS("tmp/site.rds")
# plot(site)
sample_coord <- st_coordinates(site)[,c(2,1)]

# Generate sed center and radius
gsc <- geo_sed(sample_coord)
print(gsc)
# Create 80 sided polygon based on gsc's center and radius
gsc_poly <- geo_surround_poly(gsc$center, gsc$radius, 36)
# Join all the points into a single matrix
bound_poly <- rbind(sample_coord, gsc$center, gsc_poly)
# Create SpacialPoints object and pass to mapview for visualization
  mapview(
    SpatialPoints(
      bound_poly[,c(2, 1)],
      proj4string = CRS("+proj=longlat +datum=WGS84")
    )
    )
  
# ed <- st_sfc(st_point(c(3.17, 55.98)))
# leaflet(ed) %>% 
#   addProviderTiles("CartoDB.Positron") 
# 
# df <- data.frame(cbind(c(-3.17, 23.25), c(55.98, 70.00)))
# names(df) <- c("lng", "lat")
# leaflet(df) %>% addTiles() %>%
#   addCircleMarkers(lng = ~lng, lat = ~lat)
# x
# 
# 
# sample_coord <-matrix( c(
#   sample(327131680:419648450, 10) / 10000000,
#   sample(-1147301410:-1241938690, 10) / 10000000
#   ),
# ncol = 2 )
