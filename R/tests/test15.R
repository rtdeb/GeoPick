library(sf)
library(dplyr)


madrid = st_sfc(st_point(c(-3.70, 40.42))) %>% st_set_crs(4326)
barcelona = st_sfc( st_point(c(2.18, 41.39))) %>% st_set_crs(4326)
st_distance(madrid, barcelona, which = "Great Circle")


edinburgh = st_sfc(st_point(c(3.17, 55.98))) %>% st_set_crs(4326)
alta = st_sfc( st_point(c(23.25, 70.00))) %>% st_set_crs(4326)
st_distance(edinburgh, alta, which = "Great Circle")