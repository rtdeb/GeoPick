library(geojsonsf)
library(httr)
library(dplyr)
library(plumber)
library(sf)
library(terra)

getVersion <- function(){
  req <- httr::GET("http://127.0.0.1:8000/version")
  response <- httr::content(req)
  return(response[[1]])
}

getMBC <- function(obj.geojson){
  req <- httr::POST("http://127.0.0.1:8000/mbc",
                    body = list(geojson = obj.geojson), 
                    encode = "json")
  response <- httr::content(req)
  return(response[[1]])
}

getSite <- function(type = "polygon"){
  if(type == "polygon"){
    # POLYGONS EXAMPLE
    df <- data.frame(
      name = c("Barcelona", "Dublin", "Malmö", "Budapest", "Barcelona"),
      lon = c(2.178, -6.251, 13.001, 19.049, 2.178),
      lat = c(41.397, 53.349, 55.614, 47.525, 41.397)
    )
    site <- df %>%
      st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
      summarise(geometry = st_combine(geometry)) %>%
      st_cast("POLYGON")
  } else if(type == "line"){
    # LINES EXAMPLE
    df <- data.frame(
      name = c("Barcelona", "Dublin", "Malmö"),
      lon = c(2.178, -6.251, 13.001),
      lat = c(41.397, 53.349, 55.614)
    )
    site <- df %>%
      st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
      summarise(geometry = st_combine(geometry)) %>%
      st_cast("MULTILINESTRING")
  } else if(type == "point"){
    # POINTS EXAMPLE
    df <- data.frame(
      name = c("Barcelona", "Dublin", "Malmö", "Budapest", "Lisbon", "Oslo"),
      lon = c(2.178, -6.251, 13.001, 19.049, -9.142685, 10.752245),
      lat = c(41.397, 53.349, 55.614, 47.525, 38.736946, 59.913868)
    )
    site <- df %>%
      st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
      summarise(geometry = st_combine(geometry)) %>%
      st_cast("MULTIPOINT")
  }
  site.geojson <- sf_geojson(site)
  return(site.geojson)
}

plotResult <- function(r, site, mbc, centre, p1, p2, l1, l2){
  plot(r)
  plot(site, add=T)
  plot(mbc, add=T)
  plot(centre, add=T)
  plot(p1, add=T)
  plot(p2, add=T)
  plot(l1, add=T)
  plot(l2, add=T)
}

# ================================================================================================ #
# Site
site.geojson <- getSite("polygon")
site <- geojson_sf(site.geojson)

# Print version
cat(getVersion())

# Make request and process result
req <- fromJSON(getMBC(site.geojson))
cat("Uncertainty (m) =", req$uncertainty, "\n")
mbc <- geojson_sf(req$mbc)
centre <- geojson_sf(req$centre)
p1 <- geojson_sf(req$p1)
p2 <- geojson_sf(req$p2)
l1 <- data.frame(
  rbind(
    st_coordinates(centre),
    st_coordinates(p1))
) %>% 
  st_as_sf(coords = c("X", "Y"), crs = 4326) %>%
  summarise(geometry = st_combine(geometry)) %>%
  st_cast("LINESTRING")

l2 <- data.frame(
  rbind(
    st_coordinates(centre),
    st_coordinates(p2))
) %>% 
  st_as_sf(coords = c("X", "Y"), crs = 4326) %>%
  summarise(geometry = st_combine(geometry)) %>%
  st_cast("LINESTRING")


par(mfrow=c(1,2))
r <- rast("tmp/wc2.1_10m_elev.tif")
plotResult(r, site, mbc, centre, p1, p2, l1, l2)
rc <- crop(r, ext(-65, 50, 30, 85))
plotResult(rc, site, mbc, centre, p1, p2, l1, l2)

# Show result in leaflet
# leaflet() %>% 
#   addTiles() %>% 
#   addMarkers(lng=xc, lat=yc) %>%
#   addMarkers(lng=st_coordinates(p1)[1], lat=st_coordinates(p1)[2]) %>% 
#   addMarkers(lng=st_coordinates(p2)[1], lat=st_coordinates(p2)[2]) %>% 
#   addPolygons(data = site) %>% 
#   addPolygons(data = mbc) %>% 
#   addPolylines(data = l1) %>% 
#   addPolylines(data = l2)

# Write shapefiles to disk for QGIS
st_write(site, "tmp/site.shp", append = F)
st_write(mbc, "tmp/mbc.shp", append = F)
st_write(centre, "tmp/centre.shp", append = F)
st_write(p1, "tmp/point_1.shp", append = F)
st_write(p2, "tmp/point_2.shp", append = F)
st_write(l1, "tmp/line_1.shp", append = F)
st_write(l2, "tmp/line_2.shp", append = F)


