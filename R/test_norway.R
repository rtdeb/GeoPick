source("R/norway.R")

library(leaflet)
library(sf)
library(lwgeom)

site.wkt <- norway.wkt
site.wkt <- "POLYGON ((1.604862 41.649314, 1.625805 41.648673, 1.624775 41.641874, 1.62735 41.638539, 1.633358 41.632509, 1.631298 41.630456, 1.620827 41.624682, 1.616192 41.624554, 1.612759 41.632509, 1.613445 41.636486, 1.602631 41.638667, 1.600399 41.64367, 1.598511 41.649443, 1.604862 41.649314))"

site.p <- st_as_sfc(site.wkt)
site.sec <- st_minimum_bounding_circle(site.p, nQuadSegs = 30)

plot(site.sec)
plot(site.p, add = T)


leaflet(leafletOptions(leafletCRS(crsClass = "L.CRS.EPSG4326"))) %>% 
  addTiles() %>% 
  addPolygons(data=site.sec, color = "green") %>% 
  addPolygons(data=site.p, color = "red") %>% 
  addMeasure(primaryLengthUnit = "km")

library(rworldmap)
mapCountryData()

library(tidyverse)
world_coordinates <- map_data("world") 


ggplot() + 
  geom_map(
    data = world_coordinates, map = world_coordinates,
    aes(long, lat, map_id = region)
  ) +
  geom_sf(data=site.p) +
  geom_sf(data=site.sec) +
  xlim(c(1.5,1.7)) +
  ylim(c(41.5, 41.7)) 



