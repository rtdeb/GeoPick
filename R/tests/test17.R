r <- rast("tmp/wc2.1_2.5m_tavg_12.tif")
r <- crop(r, ext(-10, 45, 30, 85))
plot(r)

cp <- st_sfc(st_point(c(9.5360875, 62.5123179))) %>% st_set_crs(4326)
cp.tr <- cp %>% st_transform(3857)
r.tr <- terra::project(r, "epsg:3857")
plot(r.tr)
max_points_polygon <- 10000
# site.sf <- readRDS("tmp/site_alta-edinburgh.rds")
coords <- matrix(c(-3.17, 55.98, 23.25, 70.00), ncol = 2, nrow = 2, byrow = T)

# site.sf <- site.sf %>% summarise(geometry = st_combine(geometry))
epsg.tr <- 3857

site.sf <- st_sfc(st_linestring(coords)) %>% st_set_crs(4326)
# need to transform to a projection so that the mbc is done correctly, if not, lat/long
# are used as planar coordinates and the mbc is not calculated correctly
site.tr <- st_transform(site.sf, epsg.tr)
plot(site.tr, add = T)
# Check if polygon is too large, if it has more than 10000 points. If so we 
# simplify with a tolerance of 500 meters
if(npts(site.tr) > as.integer(max_points_polygon)){
  site.tr <- st_simplify(site.tr, preserveTopology = TRUE, dTolerance = tolerance)
}
# Finally, calculate the minimum bounding circle
mbc.tr <- st_minimum_bounding_circle(site.tr, nQuadSegs = 30)
plot(mbc.tr, add = T)

x1.tr <- st_bbox(mbc.tr)$xmin
x2.tr <- st_bbox(mbc.tr)$xmax
y1.tr <- st_bbox(mbc.tr)$ymin
y2.tr <- st_bbox(mbc.tr)$ymax

bbox <- st_sfc(st_linestring(
rbind(
  c(x1.tr, y1.tr),
  c(x1.tr, y2.tr),
  c(x2.tr, y2.tr),
  c(x2.tr, y1.tr),
  c(x1.tr, y1.tr)))) %>% st_set_crs(epsg.tr)
plot(cp.tr, add = T)
plot(bbox, add = T)

# Determine center
radius.tr <- (st_bbox(mbc.tr)$xmax - st_bbox(mbc.tr)$xmin)/2
xc <- st_bbox(mbc.tr)$xmin + radius.tr
yc <- st_bbox(mbc.tr)$ymin + radius.tr
pc <- st_point(c(xc, yc))
pc.tr.sf <- st_as_sf(st_sfc(pc)) %>% st_set_crs(epsg.tr)

plot(pc.tr.sf, add = T)
st_distance(pc.tr.sf, x1.tr)
# Displace point if centroid outside site
if(is.na(as.integer(st_intersects(site.tr, pc.tr.sf)))){
  print("Point displaced")
  pc.tr.sf <- st_nearest_points(site.tr, pc.tr.sf)
  pc.tr.sf <- st_sfc(st_cast(pc.tr.sf, "POINT")[[1]]) %>% st_set_crs(epsg.tr)
  site.p <- st_cast(site.tr, "POINT")
  distances <- st_distance(site.p, pc.tr.sf)
  idx.furthest <- which.max(distances)
  radius <- as.double(distances[idx.furthest])
  p.furthest <- site.p[idx.furthest,]
  mbc.tr <- st_as_sf(terra::buffer(vect(pc.tr.sf), radius))
}

# Determine four cardinal points in circle (just for testing purposes)
x1.tr <- st_bbox(mbc.tr)$xmin
x2.tr <- st_bbox(mbc.tr)$xmax
y1.tr <- st_bbox(mbc.tr)$ymin
y2.tr <- st_bbox(mbc.tr)$ymax

pw <- st_as_sf(st_sfc(st_point(c(x1.tr, st_coordinates(pc.tr.sf)[2])))) %>% st_set_crs(epsg.tr)
pe <- st_as_sf(st_sfc(st_point(c(x2.tr, st_coordinates(pc.tr.sf)[2])))) %>% st_set_crs(epsg.tr)
ps <- st_as_sf(st_sfc(st_point(c(st_coordinates(pc.tr.sf)[1], y1.tr)))) %>% st_set_crs(epsg.tr)
pn <- st_as_sf(st_sfc(st_point(c(st_coordinates(pc.tr.sf)[1], y2.tr)))) %>% st_set_crs(epsg.tr)

# Transform mbc back to wgs84
mbc.4326 <- st_transform(mbc.tr, 4326)
mbc.json <- sf_geojson(mbc.4326)

# Radius/Uncertainty
radius <- as.double(st_distance(pc.tr.sf, pw))

# Spatial fit
spatial.fit <- round(radius^2 * pi / as.double(st_area(site.tr)), 3)

# Centre
centre <- st_as_sf(pc.tr.sf) %>% st_transform(4326)
centre.json <- sf_geojson(centre)
pe <- pe %>% st_transform(4326)
pw <- pw %>% st_transform(4326)
ps <- ps %>% st_transform(4326)
pn <- pn %>% st_transform(4326)

# Return not as multipolygon or multilinestring since leaflet does not support
# multipolygon or multilinestring for editing.
site.sf <- st_transform(site.tr, 4326)
if(st_geometry_type(site.sf) == "MULTIPOLYGON"){
  site.sf <- st_cast(site.sf, "POLYGON")
} else if(st_geometry_type(site.sf) == "MULTILINESTRING"){
  site.sf <- st_cast(site.sf, "LINESTRING")
}

site.gj <- sf_geojson(site.sf, simplify = F)

l <- list(mbc=mbc.json, site=site.gj, spatial_fit=spatial.fit,
          centre=centre.json, uncertainty=radius,
          pe=sf_geojson(pe), pn=sf_geojson(pn), pw=sf_geojson(pw), ps=sf_geojson(ps))

mbc.tr <- mbc.tr %>% st_transform(4326)
leaflet() %>% 
  addGeoJSON(sf_geojson(mbc.tr)) %>% 
  addTiles() %>% 
  addMeasure(primaryLengthUnit = "kilometers", primaryAreaUnit = "sqmeters")
