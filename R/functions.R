getGeoreference <- function(site.sf, max_points_polygon, tolerance){
  
  site.sf <- st_as_sf(st_combine(site.sf))
  
  # Get Centroid to determine parameters for projecting to Azimuthal Equidistant Projection 
  centroid <- st_centroid(site.sf)
  xc <- st_coordinates(centroid)[1]
  yc <- st_coordinates(centroid)[2]
  
  # We use the Azimuthal Equaldistance projection to do the calculations
  crs <- paste0("+proj=aeqd +lat_0=", yc, " +lon_0=", xc, 
                " +x_0=0 +y_0=0 +R=6371000 +units=m +no_defs +type=crs")
  
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
  
  site.sf.json <- sf_geojson(site.sf, simplify = F)
  site.tr.json <- sf_geojson(site.tr, simplify = F)
  mbc.tr.json <- sf_geojson(mbc.tr)
  centre.tr.json <- sf_geojson(st_as_sf(mbc.tr.centroid))
  
  l <- list(mbc=mbc.json, mbc.tr=mbc.tr.json, 
            site=site.sf.json, site.tr=site.tr.json, spatial_fit=spatial.fit,
            centre=centre.json, centre.tr=centre.json,
            uncertainty=round(radius),
            pe=sf_geojson(pe), pn=sf_geojson(pn), pw=sf_geojson(pw), ps=sf_geojson(ps))
  
  response <- toJSON(l, force = T, digits = NA)
  response
}