import geopandas as gpd
import pandas as pd
import pyproj
import shapely
import numpy as np
import json
import math
import location_wkt as loc

max_points_polygon =10000
tolerance = 500
n_candidates_sample = 50
sa_nearest_n = 10
random_seed = 42

def get_sec(location):
  sec = location.geometry.minimum_bounding_circle()
  return sec

def get_sec_centroid(sec):
  centroid = sec.geometry.iloc[0].centroid
  centroid = gpd.GeoSeries([centroid])
  return centroid

def get_proj_aeqd(centroid_wgs84):
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
  proj_aeqd = pyproj.CRS.from_dict(aeqd_params)
  return proj_aeqd

def simplify_geometry(location):
  # Note: For each polygon it counts twice the starting vertex since it is also the ending one
  #       However, that does not matter for our purposes
  n = len(location.get_coordinates())

  if(n > max_points_polygon):
    location = location.simplify(tolerance)
  return location

def is_centroid_inside(centroid, location):
  centroid_inside = location.contains(centroid).all()
  return centroid_inside

def get_all_vertices(location):
  df_vertices_all = location.get_coordinates()
  geometry_vertices = [shapely.geometry.Point(x, y) for x, y in zip(df_vertices_all['x'], df_vertices_all['y'])]
  vertices = gpd.GeoDataFrame(df_vertices_all, geometry = geometry_vertices)
  vertices.crs = location.crs
  return vertices

def get_candidate_vertices(df_vertices_all):
  random_seed = 42
  if(len(df_vertices_all) > n_candidates_sample):
    df = df_vertices_all.sample(n = n_candidates_sample, random_state = random_seed)
  else:
    df = df_vertices_all
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
  for i in range(0, len(candidates)):
    geometry = candidates.loc[i]['geometry']
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

def get_spatial_fit(location, uncertainty):
  if(location.type[0].lower() == 'multipolygon' or location.type[0].lower() == 'polygon'):
    spatial_fit = round(uncertainty**2 * math.pi / location.area[0], 3)
  else:
    spatial_fit = ""
  return spatial_fit

def get_georeference(location_wgs84):
  # If geometry is of type POINT return None
  if(location_wgs84.iloc[0].geom_type == 'Point'):
    return None

  # Get AEQD projection focused on WGS84 centroid
  centroid_wgs84 = location_wgs84.centroid
  proj_aeqd = get_proj_aeqd(centroid_wgs84)

  # Project location to AEQD projection
  location_aeqd = location_wgs84.to_crs(proj_aeqd)
  centroid_aeqd = centroid_wgs84.to_crs(proj_aeqd)

  # Simplify geometry if needed
  location_aeqd = simplify_geometry(location_aeqd)

  # Calculate SEC and its centroid
  sec_aeqd = get_sec(location_aeqd)
  centroid_aeqd = get_sec_centroid(sec_aeqd)
  centroid_aeqd.crs = proj_aeqd

  centroid_inside = is_centroid_inside(centroid_aeqd, location_aeqd)

  if centroid_inside:
    vertex_x = sec_aeqd.get_coordinates().iloc[0]["x"]
    vertex_y = sec_aeqd.get_coordinates().iloc[0]["y"]
    vertex = gpd.GeoSeries(shapely.geometry.Point(vertex_x, vertex_y))
    vertex.crs = proj_aeqd
    uncertainty = centroid_aeqd.distance(vertex)[0]
    centroid = centroid_aeqd
    sec = gpd.GeoSeries(centroid.buffer(uncertainty))
  else:
    # Get all vertices of location
    vertices = get_all_vertices(location_aeqd)

    # Get candidate vertices
    candidates = get_candidate_vertices(vertices)

    # Calculate nearest point from centroid to location
    np = get_nearest_point(centroid_aeqd, location_aeqd, proj_aeqd)

    # Add nearest point to candidate points
    candidates = pd.concat([candidates, np], ignore_index=True)
    candidates = candidates.reset_index(drop=True)

    # FIRST APPROXIMATION
    fa = get_minimum_distance_candidate(candidates, vertices)
    centroid_fa = gpd.GeoSeries(fa[0])
    centroid_fa.crs = proj_aeqd
    uncertainty_fa = fa[1]
    sec_fa = gpd.GeoSeries(centroid_fa.buffer(uncertainty_fa))
    sec_fa.crs = proj_aeqd

    # SECOND APPROXIMATION
    np_centroid_fa = get_nearest_n_vertices(vertices, centroid_fa, 10)
    sa = get_minimum_distance_candidate(np_centroid_fa, vertices)
    centroid_sa = gpd.GeoSeries(sa[0])
    centroid_sa.crs = proj_aeqd
    uncertainty_sa = sa[1]
    sec_sa = gpd.GeoSeries(centroid_fa.buffer(uncertainty_sa))
    sec_sa.crs = proj_aeqd

    # Compare uncertainty of first and second approximations
    if(uncertainty_sa < uncertainty_fa):
      centroid = sa[0]
      uncertainty = sa[1]
      sec = sec_sa
    else:
      centroid = fa[0]
      uncertainty = fa[1]
      sec = sec_fa

    centroid = gpd.GeoSeries(centroid)
    centroid.crs = proj_aeqd

  # Calculate spatial fit
  spatial_fit = get_spatial_fit(location_aeqd, uncertainty)

  # Project back to WGS84 projection
  centroid = centroid.to_crs(4326)
  sec = sec.to_crs(4326)

  response = centroid, uncertainty, sec, spatial_fit
  return response

def get_json_georeference(location):
  georef = get_georeference(location)
  if georef is not None:
    centroid = georef[0]
    uncertainty = round(georef[1])
    sec = georef[2]
    spatial_fit = georef[3]
    data = {
      "mbc": json.loads(sec.to_json()),
      "site": json.loads(location.to_json()),
      "centroid": json.loads(centroid.to_json()),
      "uncertainty": uncertainty,
      "spatial_fit": spatial_fit
    }
  else:
    data = {"georef": "None"}
  return data

def json_to_geoseries(json):
  location = gpd.read_file(json, driver = 'GeoJSON')
  location.crs = 4326
  location = location["geometry"]
  return location

def print_georeference(georeference, markdown = True):
  centroid = georeference[0].iloc[0]
  uncertainty = georeference[1]
  spatial_fit = georeference[3]
  if markdown:
    tab = "    "
    br = "<br>"
  else:
    tab = "\t"
    br = "\n"
  georeference_string = "**LOCATION'S CENTROID:** " + br + br + tab + \
    "Latitude, Longitude: " + str(round(centroid.y, 7)) + ", " + str(round(centroid.x, 7)) + \
    br + tab + "Uncertainty: " + str(round(uncertainty)) + "m" + br + tab + \
    "Spatial fit: " + str(spatial_fit)
  return georeference_string

def get_radius_line(center, circle):
    coords1 = center.get_coordinates()
    p1 = [coords1["x"][0], coords1["y"][0]]
    coords2 = circle.get_coordinates().iloc[0]
    p2 = [max(circle.get_coordinates()["x"]), coords2["y"]]
    length = str(round((max(circle.get_coordinates()["x"]) - coords1["x"])[0])) + "m"
    radius_line = gpd.GeoSeries(
        [
            shapely.geometry.LineString([(p1[0], p1[1]), (p2[0], p2[1])]),
        ],
        crs=center.crs
    )
    return radius_line, length

def extract_wkt(items):
    wkt = None
    for item in items:
        if item.startswith("POINT") or item.startswith("LINESTRING") or \
          item.startswith("MULTILINESTRING") or item.startswith("POLYGON") or \
          item.startswith("MULTIPOLYGON"):
            wkt = item
            break  # Stop searching once a match is found
    return wkt

def get_location():
    items = loc.capdecreus_wkt.split("\t")
    location_wkt = extract_wkt(items)
    if location_wkt.startswith("POINT"):
        if len(items) == 1:
            print("POINT geometry, uncertainty not specified.\n")
        else:
            print("POINT geometry.\n")
            print("Latitude:", items[0], ", Longitude:", items[1], ", Uncertainty:", items[3])
        class StopExecution(Exception):
            def _render_traceback_(self):
                return []
        raise StopExecution

    location_wgs84 = gpd.GeoSeries(shapely.wkt.loads(location_wkt))
    location_wgs84.crs = "EPSG:4326"
    return location_wgs84
