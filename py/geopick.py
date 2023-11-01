import geopandas as gpd
import pandas as pd
import pyproj
import shapely
import matplotlib.pyplot as plt
import numpy as np

max_points_polygon =10000
tolerance = 500
n_candidates_sample = 50
sa_nearest_n = 10
random_seed = 33

def get_sec(location):
  sec = location.geometry.minimum_bounding_circle()
  return sec

def get_sec_centroid(sec, epsg):
  centroid = sec.geometry.iloc[0].centroid
  centroid = gpd.GeoSeries([centroid])
  centroid.crs = "EPSG:" + str(epsg)
  return centroid

def get_aeqd_proj(location_wgs84):
  sec_wgs84 = get_sec(location_wgs84)
  centroid_wgs84 = get_sec_centroid(sec_wgs84, 4326)
  y, x = centroid_wgs84.geometry.y.iloc[0], centroid_wgs84.geometry.x.iloc[0]
  aeqd_params = {
    'proj': 'aeqd',
    'lat_0': y,
    'lon_0': x,
    'y_0': 0,
    'x_0': 0,
    '+R': '6371000',
    '+units': "m",
    'ellps': 'WGS84'
  }
  aeqd_proj = pyproj.CRS.from_dict(aeqd_params)
  return aeqd_proj

def simplify_geometry(location):
  # Note: For each polygon it counts twice the starting vertex since it is also the ending one
  #       However, that does not matter for our purposes
  n = len(location.get_coordinates())
  
  if(n > max_points_polygon):
    location = location.simplify(tolerance)
  return location

def is_centroid_inside(centroid, location):
  centroid_inside = centroid.within(location)
  return centroid_inside.all()  

def get_all_vertices(location):
  df_vertices_all = location.get_coordinates()
  geometry_vertices = [shapely.geometry.Point(x, y) for x, y in zip(df_vertices_all['x'], df_vertices_all['y'])]
  gdf_vertices_all = gpd.GeoDataFrame(df_vertices_all, geometry = geometry_vertices)
  gdf_vertices_all.crs = location.crs
  return gdf_vertices_all

def get_candidate_vertices(df_vertices_all):
  if(len(df_vertices_all) > n_candidates_sample):
    df = df_vertices_all.sample(n = n_candidates_sample, random_state = random_seed)
  else:
    df = df_vertices_all
  print(type(df))
  geometry = [shapely.geometry.Point(x, y) for x, y in zip(df['x'], df['y'])]
  gdf = gpd.GeoDataFrame(df, geometry = geometry)  
  return gdf

def get_nearest_point(centroid, location, proj):
  nearest = shapely.ops.nearest_points(centroid.geometry.iloc[0], location)[1]
  nearest.crs = proj
  df_np = nearest.get_coordinates()
  geometry_np = [shapely.geometry.Point(x, y) for x, y in zip(df_np['x'], df_np['y'])]
  gdf_np = gpd.GeoDataFrame(df_np, geometry = geometry_np)
  gdf_np.crs = proj
  return gdf_np

def get_minimum_distance_candidate(candidates, vertices):
  distance = float(4 * 10**8)
  for i in range(0, len(candidates) - 1):
    geometry = candidates.iloc[i]['geometry']
    d = max(geometry.distance(vertices['geometry']))  
    if(d < distance):
      distance = d
      idx = i
  distance = round(distance,0)
  min_d_candidate = candidates['geometry'].iloc[idx]
  return min_d_candidate, distance

def get_nearest_n_vertices(vertices, point, n):
  distances = point.distance(vertices)
  vertices["distances"] = distances
  sorted_indices = np.argsort(distances)
  sorted_gdf = vertices.iloc[sorted_indices]
  sorted_gdf.reset_index(drop=True, inplace=True)
  nearest_points = sorted_gdf.head(n)
  return nearest_points

def get_georeference(location_wgs84):
  # Get SEC and centroid
  sec_wgs84 = get_sec(location_wgs84)
  centroid_wgs84 = get_sec_centroid(sec_wgs84, 4326)

  # Get parameterized AEQD
  aeqd_proj = get_aeqd_proj(location_wgs84)

  # Project to AEQD
  location_aeqd = location_wgs84.to_crs(aeqd_proj)
  centroid_aeqd = centroid_wgs84.to_crs(crs = aeqd_proj)

  # Simplify geometry
  location_aeqd = simplify_geometry(location_aeqd)

  # Get SEC and centroid
  sec_aeqd = get_sec(location_aeqd)
  sec_centroid_aeqd = sec_aeqd.centroid

  centroid_inside = is_centroid_inside(centroid_aeqd, location_aeqd)

  if not centroid_inside: 
    # Get candidate vertices
    gdf_vertices_all = get_all_vertices(location_aeqd)
    gdf = get_candidate_vertices(gdf_vertices_all)
    # Calculate nearest point from centroid to geometry
    gdf_np = get_nearest_point(centroid_aeqd, location_aeqd, aeqd_proj)
    # Add nearest point to candidate points
    gdf_candidates = pd.concat([gdf_np, gdf], ignore_index=True)
    # First approximation SEC and centroid
    candidate_fa = get_minimum_distance_candidate(gdf_candidates, gdf_vertices_all)
    # plotResult(location_aeqd, gdf_candidates, candidate_fa[0], candidate_fa[1], aeqd_proj)
    # Second approximation SEC and centroid
    nearest_vertices = get_nearest_n_vertices(gdf_vertices_all, sec_centroid_aeqd, sa_nearest_n)
    candidate_sa = get_minimum_distance_candidate(nearest_vertices, gdf_vertices_all)
    # plotResult(location_aeqd, nearest_vertices, candidate_sa[0], candidate_sa[1], aeqd_proj)
    if(candidate_sa[1] < candidate_fa[1]):
      candidate = candidate_sa
    else:
      candidate = candidate_fa

  sec_centroid_aeqd = gpd.GeoSeries(candidate[0])
  sec_centroid_aeqd.crs = aeqd_proj
  sec_aeqd = sec_centroid_aeqd.buffer(candidate[1])
  sec_aeqd.crs = aeqd_proj

  # Reproject back to WGS84
  centroid = gpd.GeoSeries(sec_centroid_aeqd.to_crs(crs="EPSG:4326"))
  sec = gpd.GeoSeries(sec_aeqd.to_crs(crs="EPSG:4326"))
  return centroid, candidate[1], sec

