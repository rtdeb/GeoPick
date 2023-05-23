

library(units)

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

getSegments2 <- function(segment, n){
  if(st_geometry_type(segment)[1] == "MULTILINESTRING"){
    segment <- st_cast(segment, "LINESTRING")
  }
  processed.site <- NULL
  for(i in 1:length(st_geometry(segment))){
    seg <- st_geometry(segment)[i]
    ipc <- st_coordinates(seg)[1, 1:2]
    fpc <- st_coordinates(seg)[2, 1:2]
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
    processed.site <- rbind(processed.site, ls %>% st_transform(4326))
  }
  st_as_sf(st_combine(processed.site))
}


wkt <- 'MULTILINESTRING ((-3 30, 12 40),(12 40, 25 75))'
site.sf <- st_set_crs(st_as_sf(st_as_sfc(wkt)), 4326)
centroid <- st_centroid(site.sf)
xc <- st_coordinates(centroid)[1]
yc <- st_coordinates(centroid)[2]
crs <- paste0("+proj=laea +lat_0=", yc, " +lon_0=", xc, 
              " +x_0=4321000 +y_0=3210000 +ellps=GRS80 ", 
              "+towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs")
site.tr <- site.sf %>% st_transform(crs)

bx <- 45
by <- 43
par(mfrow=c(1,2))
r <- rast("tmp/wc2.1_10m_tavg_11.tif")
r <- crop(r, ext(xc - bx, xc + bx, yc - by, yc + by))
r.tr <- terra::project(r, crs)
plot(r.tr, main = "EPSG:LAEA")
plot(site.tr, add = T)
plot(mbc.tr, add = T)
plot(centroid.tr, add = T)

plot(r, main = "EPSG:4326")
ls <- getSegments2(site.tr, 30)
mbc.tr <- st_minimum_bounding_circle(site.tr)
centroid.tr <- st_centroid(mbc.tr)
centroid <- centroid.tr %>% st_transform(4326)
mbc <- mbc.tr %>% st_transform(4326)
plot(mbc, add=T)
plot(ls, add=T)
plot(centroid, add = T)


leaflet() %>% 
  addTiles() %>% 
  addGeoJSON(sf_geojson(ls)) %>%
  addMeasure(primaryLengthUnit = "kilometers") %>% 
  addGeoJSON(sf_geojson(mbc)) %>% 
  addGeoJSON(sf_geojson(centroid)) %>% 
  addMouseCoordinates() %>% 
  addMeasure(primaryLengthUnit = "kilometers") %>% 
  setView(lng = 0, lat = 42, zoom = 3)


