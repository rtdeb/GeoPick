library(geojsonsf)
library(httr)
library(dplyr)
library(plumber)
library(sf)
library(terra)
library(jsonlite)
library(leaflet)

getVersion <- function(){
  req <- httr::GET("http://127.0.0.1:8000/version")
  response <- httr::content(req)
  return(response[[1]])
}

getMBC <- function(obj.geojson){
  req <- httr::POST(url = "http://127.0.0.1:8000/mbc",
                    body = site.geojson, encode = "json")
  response <- httr::content(req)
  return(response[[1]])
}

getSite <- function(type = "polygon"){
  if(type == "polygon"){
    # POLYGONS EXAMPLE
    # df <- data.frame(
    #   name = c("Barcelona", "Dublin", "Malmö", "Budapest", "Barcelona"),
    #   lon = c(2.178, -6.251, 13.001, 19.049, 2.178),
    #   lat = c(41.397, 53.349, 55.614, 47.525, 41.397)
    # )
    # df <- data.frame(
    #   lon = c(0.074,4.255,32.459,14.832,-5.9583, 0.074),
    #   lat = c(41.642,52.603,49.852,56.174,55.626, 41.642)
    # )
    df <- data.frame(
      lon = c(4.226,-5.564,-8.610,-5.420,4.659,4.622,-3.990,-6.438,-3.985,4.374,4.226),
      lat = c(47.701,48.397,44.034,38.614,38.457,40.474,40.631,44.219,47.005,46.536,47.701)
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

# function(req) {
mbcNoAPI <- function(body) {
  # polygon.sf <- geojson_sf(toJSON(req$body))
  polygon.sf <- geojson_sf(body)
  
  # Minimum bounding circle
  mbc <- st_minimum_bounding_circle(polygon.sf, nQuadSegs = 30)
  mbc.json = sf_geojson(mbc)
  
  # Radius
  radius.dd <- (st_bbox(mbc)$xmax - st_bbox(mbc)$xmin)/2
  
  # Centre
  xc <- as.numeric(st_bbox(mbc)$xmin + radius.dd)
  yc <- as.numeric(st_bbox(mbc)$ymin + radius.dd)
  centre <- st_sfc(st_point(c(xc, yc))) %>% st_set_crs(4326) %>% st_as_sf(.)
  centre.json <- sf_geojson(centre)
  
  # Uncertainty
  x2 <- st_bbox(mbc)["xmax"]
  y2 <- st_bbox(mbc)["ymax"]
  p1 <- st_sfc(st_point(c(xc, yc))) %>% st_set_crs(4326)
  p2 <- st_sfc(st_point(c(x2, y2))) %>% st_set_crs(4326)
  uncertainty <- as.numeric(st_distance(p1, p2))
  
  # p1 and p2 points (only for checking)
  p1 <- st_sfc(st_point(c(xc, yc + radius.dd))) %>% st_set_crs(4326) %>% st_as_sf(.)
  p2 <- st_sfc(st_point(c(xc + radius.dd, yc))) %>% st_set_crs(4326) %>% st_as_sf(.)
  p1.json <- sf_geojson(p1)
  p2.json <- sf_geojson(p2)
  
  l <- list(mbc=mbc.json, centre=centre.json, uncertainty=uncertainty,
            radius=radius.dd, p1 = p1.json, p2 = p2.json)
  toJSON(l)
}

# ================================================================================================ #
# Site
site.geojson <- getSite("polygon")
site <- geojson_sf(site.geojson)

# Print version
# cat(getVersion())

# Make request to API and process result
# req <- fromJSON(getMBC(site.geojson))

# Make request without API and process result
req <- fromJSON(mbcNoAPI(site.geojson))

mbc <- req$mbc
centre <- req$centre
p1 <- req$p1
p2 <- req$p2
uncertainty <- req$uncertainty

cat("Uncertainty (m) =", uncertainty, "\n")
mbc <- geojson_sf(mbc)
centre <- geojson_sf(centre)
p1 <- geojson_sf(p1)
p2 <- geojson_sf(p2)
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
# plotResult(r, site, mbc, centre, p1, p2, l1, l2)

par(mfrow=c(1,1))
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


