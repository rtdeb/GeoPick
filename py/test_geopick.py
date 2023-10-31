import geopandas as gpd
import pandas as pd
import pyproj
import shapely
import matplotlib.pyplot as plt
import pathlib
import numpy as np
import geopick as gp

def plotResult(location, candidates, centroid, distance, proj):
  vertices_all = get_all_vertices(location)
  centroid = gpd.GeoSeries(centroid)
  centroid.crs = proj
  sec = centroid.buffer(distance)
  sec.crs = proj
  fig, ax = plt.subplots(figsize=(8, 8))
  sec.plot(facecolor = "none", edgecolor = "blue", linestyle = "dashed", ax = ax)
  location.plot(color = "red", ax = ax)
  vertices_all.plot(color = "yellow", ax = ax)
  candidates.plot(color = "green", ax = ax)
  centroid.plot(ax = ax, color = "blue", markersize = 50, marker = "o")
  plt.show()

f_wkt = "data/capdecreus.txt"
location_wkt = pathlib.Path(f_wkt).read_text()
location_wgs84 = gpd.GeoSeries(shapely.wkt.loads(location_wkt))
location_wgs84.crs = "EPSG:4326"
georef = gp.get_georeference(location_wgs84)

# Print result
centroid_coordinates = georef[0].get_coordinates()
distance = georef[1]
print(distance)
print("CENTROID")
print(f"Latitude: {centroid_coordinates['y'].iloc[0]:.7f}, \
# Longitude: {centroid_coordinates['x'].iloc[0]:.7f}, \
# Uncertainty: {georef[1]:.0f}m")
