source("R/test_data.R")
library(leaflet)
library(leafem)
library(plumber)
library(lwgeom)
library(geojsonsf)
library(sf)
library(jsonlite)
library(terra)
library(stringr)
library(mapview)
library(geosed)
library(useful)
getSegments <- function(segment, n){
  ipc <- st_coordinates(segment)[1, 1:2]
  fpc <- st_coordinates(segment)[2, 1:2]
  dx <- fpc[1] - ipc[1]
  dy <- fpc[2] - ipc[2]
  rad <- as.numeric(set_units(atan(dy/dx), "radians"))
  h <- sqrt(dx^2 + dy^2)
  df <- data.frame(cbind(x=ipc[1], y=ipc[2]))
  for(i in 1:n){
    xt <- ipc[1] + i*(h/n)*cos(rad)
    yt <- ipc[2] + i*(h/n)*sin(rad)
    df <- rbind(df, cbind(x=xt, y=yt))
    df
  }
  df$x <- as.numeric(df$x)
  df$y <- as.numeric(df$y)
  
  ls <- st_as_sf(st_sfc(st_linestring(as.matrix(df)))) %>% st_set_crs(st_crs(site.tr))
  ls %>% st_transform(4326)
}

# function(req) {
#   site.geojson <- toJSON(req$body, digits = NA)
#   site.sf <- geojson_sf(site.geojson)
kk <- function(site.sf) {
  # site.sf <- site.sf %>% sf::summarise(geometry = st_combine(geometry))
  
  # Get Centroid to determine parameters for projecting to LAEA 
  centroid <- st_centroid(site.sf)
  xc <- st_coordinates(centroid)[1]
  yc <- st_coordinates(centroid)[2]
  crs <- paste0("+proj=laea +lat_0=", yc, " +lon_0=", xc, 
                " +x_0=4321000 +y_0=3210000 +ellps=GRS80 ", 
                "+towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs")
  
  # Project site to parameterized LAEA
  site.tr <- site.sf %>% st_transform(crs)
  
  # Check if polygon is too large, if it has more than 10000 points. If so we 
  # simplify with a tolerance of 500 meters
  if(npts(site.tr) > as.integer(max_points_polygon)){
    site.tr <- st_simplify(site.tr, preserveTopology = TRUE, dTolerance = tolerance)
  }
  
  # Calculate MBC and centroid on projected site
  mbc.tr <- st_minimum_bounding_circle(site.tr, nQuadSegs = 30)
  mbc.tr.centroid <- st_centroid(mbc.tr)
  
  # Displace centroid outside site
  if(is.na(as.integer(st_intersects(site.tr, mbc.tr.centroid)))){
    mbc.tr.centroid <- st_nearest_points(site.tr, mbc.tr.centroid)
    mbc.tr.centroid <- st_sfc(st_cast(mbc.tr.centroid, "POINT")[[1]]) %>% st_set_crs(crs)
    site.p <- st_cast(site.tr, "POINT")
    distances <- st_distance(site.p, mbc.tr.centroid)
    idx.furthest <- which.max(distances)
    radius <- as.double(distances[idx.furthest])
    p.furthest <- site.p[idx.furthest,]
    mbc.tr <- st_as_sf(terra::buffer(vect(mbc.tr.centroid), radius))
  }
  
  # Get uncertainty, i.e. from centroid to any point in circle
  p <- st_set_crs(st_as_sf(st_sfc(st_point(st_coordinates(mbc.tr)[1, 1:2]))), crs)
  radius <- st_distance(p, mbc.tr.centroid)
  
  # Calculate spatial fit
  spatial.fit <- round(radius^2 * pi / as.double(st_area(site.tr)), 3)
  
  # Determine four cardinal points in circle (just for testing purposes)
  x1.tr <- st_bbox(mbc.tr)$xmin
  x2.tr <- st_bbox(mbc.tr)$xmax
  y1.tr <- st_bbox(mbc.tr)$ymin
  y2.tr <- st_bbox(mbc.tr)$ymax
  
  pw <- st_as_sf(st_sfc(st_point(c(x1.tr, st_coordinates(mbc.tr.centroid)[2])))) %>% 
    st_set_crs(crs)
  pe <- st_as_sf(st_sfc(st_point(c(x2.tr, st_coordinates(mbc.tr.centroid)[2])))) %>% 
    st_set_crs(crs)
  ps <- st_as_sf(st_sfc(st_point(c(st_coordinates(mbc.tr.centroid)[1], y1.tr)))) %>% 
    st_set_crs(crs)
  pn <- st_as_sf(st_sfc(st_point(c(st_coordinates(mbc.tr.centroid)[1], y2.tr)))) %>% 
    st_set_crs(crs)
  
  # Transform mbc back to wgs84
  mbc.4326 <- st_transform(mbc.tr, 4326)
  mbc.json <- sf_geojson(mbc.4326)
  
  # Centre
  centre <- st_as_sf(mbc.tr.centroid) %>% st_transform(4326)
  centre.json <- sf_geojson(centre)
  pe <- pe %>% st_transform(4326)
  pw <- pw %>% st_transform(4326)
  ps <- ps %>% st_transform(4326)
  pn <- pn %>% st_transform(4326)
  
  # Return not as multipolygon or multilinestring since leaflet does not support
  # multipolygon or multilinestring for editing.
  if(st_geometry_type(site.sf) == "MULTIPOLYGON"){
    site.sf <- st_cast(site.sf, "POLYGON")
  } else if(st_geometry_type(site.sf) == "MULTILINESTRING"){
    site.sf <- st_cast(site.sf, "LINESTRING")
  }
  
  site.gj <- sf_geojson(site.sf, simplify = F)
  # site.sf <- getSegments(site.tr, 10)
  l <- list(mbc=mbc.json, mbc.tr=sf_geojson(centre), 
            site=sf_geojson(site.sf), site.tr=sf_geojson(site.tr),spatial_fit=spatial.fit,
            centre=centre.json, centre.tr=centre.json,
            uncertainty=round(radius),
            pe=sf_geojson(pe), pn=sf_geojson(pn), pw=sf_geojson(pw), ps=sf_geojson(ps))
  
  response <- toJSON(l, force = T, digits = NA)
  response
}


max_points_polygon <- 10000

coords <- matrix(c(15.239274, 68.39918, -13.936656, 49.61071, 3.639205, 29.53523, -5.148726, 48.458352, 44.063687, 74.496413, 15.239274, 68.39918), ncol = 2, nrow = 6, byrow = T)
coords <- matrix(c(12.57296, 55.725887, 12.571163, 55.72563, 12.57185, 55.725246, 12.572681, 55.725264, 12.571598, 55.725557, 12.57296, 55.725887), ncol = 2, nrow = 6, byrow = T)
coords <- matrix(c(0, -85, 5, 85), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(-3.17, 55.98, 23.25, 70.00), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(75, -55.98, 23.25, -70.00), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(75, 55.98, 23.25, 70.00), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(45, -25, 18, -33, 51, -66), ncol = 2, nrow = 3, byrow = T)
coords <- matrix(c(78, 21, 98, -15), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(32, -78, 119, -70.00), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(-8, 43, 8, 59), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(-8, 43, 8, -59), ncol = 2, nrow = 2, byrow = T)
coords <- matrix(c(-3.17, 55.98, 23.25, 70.00), ncol = 2, nrow = 2, byrow = T)

site.sf <- st_as_sf(st_sfc(st_linestring(coords))) %>% st_set_crs(4326)
res <- fromJSON(kk(site.sf))

centroid <- st_centroid(site.sf)
xc <- st_coordinates(centroid)[1]
yc <- st_coordinates(centroid)[2]
crs <- paste0("+proj=laea +lat_0=", yc, " +lon_0=", xc, 
              " +x_0=4321000 +y_0=3210000 +ellps=GRS80 ", 
              "+towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs")
names(res)

par(mfrow=c(1,2))
r <- rast("tmp/wc2.1_10m_tavg_11.tif")
r <- crop(r, ext(xc - 45, xc + 45, yc - 25, yc + 25))

r.tr <- terra::project(r, crs)
plot(r.tr)

plot(geojson_sf(res$mbc.tr), add = T)
plot(geojson_sf(res$site.tr), add = T)
plot(geojson_sf(res$centre.tr), add = T)


site <- geojson_sf(res$site)

mbc <- geojson_sf(res$mbc)
centre <- geojson_sf(res$centre)

plot(r)
plot(mbc, add = T)
plot(site, add = T)
plot(centre, add = T)

leaflet() %>% 
  addTiles() %>% 
  addGeoJSON(sf_geojson(site)) %>% 
  addMeasure(primaryLengthUnit = "kilometers") %>% 
  addGeoJSON(sf_geojson(mbc)) %>% 
  addGeoJSON(sf_geojson(centre)) %>% 
  addMouseCoordinates() %>% 
  addMeasure(primaryLengthUnit = "kilometers") %>% 
  setView(lng = 0, lat = 42, zoom = 3)
