# Single function doing all the work:
# 1. Receives JSON and converts to sf object
# 2. Estimates an approximate centroid where to center the projection for calculations
# 3. Projects site to Azimuthal Equidistance
# 4. Calculates minimum bounding circle (MBC) and centroid
# 5. If centroid falls outside the georeferenced site, recalculates MBC using closest point in site
# 6. Calculates uncertainty as radius of MBC
# 7. Reprojects MBC and centroid to WGS84, plus some additional data for checking purposes
# 8. Returns list as JSON with the calculated MBC and centroid

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
  
  # Transform mbc back to wgs84
  mbc.4326 <- st_transform(mbc.tr, 4326)
  mbc.json <- sf_geojson(mbc.4326)
  
  # Centre
  centroid <- st_as_sf(mbc.tr.centroid) %>% st_transform(4326)
  centroid.json <- sf_geojson(centroid)

  # Return not as multipolygon or multilinestring since leaflet does not support
  # multipolygon or multilinestring for editing.
  if(st_geometry_type(site.sf) == "MULTIPOLYGON"){
    site.sf <- st_cast(site.sf, "POLYGON")
  } else if(st_geometry_type(site.sf) == "MULTILINESTRING"){
    site.sf <- st_cast(site.sf, "LINESTRING")
  }
  
  site.sf.json <- sf_geojson(site.sf, simplify = F)
  
  l <- list(mbc=mbc.json, site=site.sf.json, spatial_fit=spatial.fit,
            centroid=centroid.json, uncertainty=round(radius))

  response <- toJSON(l, force = T, digits = NA)
  return(response)
}