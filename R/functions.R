# ----------------------------------------------------------------------------------------- #
# Helping functions 
# ----------------------------------------------------------------------------------------- #
# Returns the radius as the maximum distance between point (pt) and a set of points (pts) encompassing all pts
getRadius <- function(pt, pts){
  distances <- st_distance(pt, pts)
  radius <- distances[which.max(distances)]
  return(radius)
}

# Returns the n number of points from a set of points, site.pts, that are closest to point pt
# site.pts is an sf object of POINT type representing all the vertices of the site
# n is the number of closest points we want
getNearestPoints <- function(site.pts, pt, n){
  if(n >= nrow(site.pts)){
    cat("n is equal or greater than the number of points, will return all of them.\n")
    n <- nrow(site.pts) - 1
  }
  ds <- data.frame(st_distance(site.pts, pt))
  ds$idx <- row.names(site.pts)
  names(ds) <- c("d", "idx")
  ds$d <- as.double(ds$d)
  ds <- ds[order(ds$d),]
  ds <- ds[ds$d != 0,]
  ds <- ds[1:n,]
  site.pts <- site.pts[ds$idx,]
  return(site.pts)
}


# x,y is point; ccx,ccy is circle center; r is radius
distanceToCircle <- function(x, y, ccx, ccy, r) {
  return(sqrt((x - ccx)^2 + (y - ccy)^2) - r)
}

# Given a set of candidate points it returns the one which is the center of a circle encompassing
# all site.pts points and minimizing the radius.
approximateSEC <- function(site.pts, candidate.pts, center = NA, radius = 10^8){
  sec <- list(center=center, radius=radius)
  for(i in 1:nrow(candidate.pts)){
    r <- as.double(getRadius(candidate.pts[i,], site.pts))
    if(r <= sec$radius){
      sec$radius <- r
      sec$center <- candidate.pts[i,]
    }
  }
  return(sec)
}

# Get SEC according to closest point on geometry
# site.tr: geometry
# pt: point from which to calculate closest point on site.tr
# crs: reference system
getNearestPointOnGeometry <- function(site.tr, pt, crs){
  pt <- st_nearest_points(site.tr, pt)
  pt <- st_sfc(st_cast(pt, "POINT")[[1]]) %>% st_set_crs(crs)
  pt <- st_as_sf(pt)
  return(pt)
}

# ========================================================================================= #
#  Main function 
#  Steps:
#  1. Transform site to Azimuthal Equidistance centered on site's centroid in order to minimize
#     distortions.
#  2. Calculate smallest enclosing circle (SEC) and its center as centroid.
#  3. If the centroid falls outside the georeferenced site, we recalculate SEC using an approximation
#     by selecting random vertices from the geometry, determining which one delivers best SEC,
#     and then exploring the n.nearest vertices to the selected point and again determining 
#     which one delivers best SEC, thus improving the first random approximation.
#  4. Once we have the definitive centroid we calculate the value of the radius as uncertainty.
#  5. Reproject back to WGS84 and return for displaying in Leaflet
#  Parameters:  
#    - site.sf: sf object of the digitized site
#    - max_points_polygon: maximum number of vertices per geometry for performance reasons\
#    - tolerance: tolerance (in meters) used to simplify geometry if necessary
#    - n.sample: Number of vertices to sample for a first SEC approximation
#    - n.nearest: Number of neighbours to first SEC approximation to improve it further
# ----------------------------------------------------------------------------------------- #
getGeoreference <- function(site.sf, max_points_polygon, tolerance, n.sample, n.nearest){
  
  site.sf <- st_as_sf(st_combine(site.sf))
  
# Get Centroid to determine lat_0 and long_0 parameters for projecting to the 
# Azimuthal Equidistant Projection centered on the geometry
  centroid <- st_centroid(site.sf)  
  xc <- st_coordinates(centroid)[1]
  yc <- st_coordinates(centroid)[2]
  crs <- paste0("+proj=aeqd +lat_0=", yc, " +lon_0=", xc, 
                " +x_0=0 +y_0=0 +R=6371000 +units=m +no_defs +type=crs")
  
  # Project site to parameterized AEQD
  site.tr <- site.sf %>% st_transform(crs)
  
  # Check if polygon is too large, if it has more than 10000 points. If so we 
  # simplify with a tolerance of 500 meters
  if(npts(site.tr) > as.integer(max_points_polygon)){
    site.tr <- st_simplify(site.tr, preserveTopology = TRUE, dTolerance = tolerance)
  }
  
  # Calculate SEC and centroid on projected site
  mbc.tr <- st_minimum_bounding_circle(site.tr, nQuadSegs = 30)
  mbc.tr.centroid <- st_centroid(mbc.tr)
  
  # Get uncertainty, i.e. from centroid to any point in circle, e.g. point at index = 1
  p <- st_set_crs(st_as_sf(st_sfc(st_point(st_coordinates(mbc.tr)[1, 1:2]))), crs)
  radius <- st_distance(p, mbc.tr.centroid)
    
# If centroid is not on top of geometry (on top of line or inside polygon), we approximate best SEC
if(is.na(as.integer(st_intersects(site.tr, mbc.tr.centroid)))){
  site.pts <- st_cast(site.tr, "POINT") %>% mutate(idx = row.names(.))
  # We randomly sample n points from all points, geometry vertices, to find a first approximation to
  # which vertex optimizes the sec
  # For each point in nearest.pts we look for its furthest point in site.pts and record its distance
  # We finally choose the point whose distance to the furthest point is minimized
  if(nrow(site.pts) > n.sample){
    point.idxs <- sample(1:nrow(site.pts), n.sample)
    candidate.pts <- site.pts %>% slice(point.idxs) 
  } else {
    # In the case we have less points than the number we want to sample, we deal with them all
    candidate.pts <- site.pts    
  }
  
  # We add the closest point from non-corrected center to site.tr, whether or not it is a vertex, as
  # a new candidate, since it may well be a good candidate.
  pt <- getNearestPointOnGeometry(site.tr, mbc.tr.centroid, crs) %>% 
    mutate(idx = max(as.numeric(candidate.pts$idx)) + 1)
  candidate.pts <- rbind(candidate.pts, pt)
  
  sec <- approximateSEC(site.pts, candidate.pts, NA, 10^8)

  # Once we have a first approximation through randomization, we explore the neighbours of the selected
  # point in order to to see if one of them still improves the sec
  nearest.pts <- getNearestPoints(site.pts, sec$center, n.nearest)
  sec <- approximateSEC(site.pts, nearest.pts, sec$center, sec$radius)
  radius <- sec$radius
  mbc.tr.centroid <- sec$center %>% dplyr::select(-idx)

  mbc.tr <- st_as_sf(terra::buffer(vect(mbc.tr.centroid), radius))
}

  # Calculate spatial fit
  spatial.fit <- round(radius^2 * pi / as.double(st_area(site.tr)), 3)
  
  # Transform mbc back to wgs84 in geojson
  mbc.4326 <- st_transform(mbc.tr, 4326)
  mbc.json <- sf_geojson(mbc.4326)
  
  # Transform centroid back to wgs84 in geojson
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