import geopandas as gpd
import pandas as pd
import shapely
import matplotlib.pyplot as plt
import contextily as ctx
import matplotlib.ticker as ticker

def plot_earth_aeqd(proj_aeqd):
  world_4326 = gpd.read_file("../data/CNTR_RG_01M_2020_4326.geojson")
  world_aeqd = world_4326.to_crs(proj_aeqd)
  lon = proj_aeqd.to_dict().get("lon_0")
  lat = proj_aeqd.to_dict().get("lat_0")
  center = gpd.GeoSeries(shapely.geometry.Point([lon, lat]))
  # Plot
  fig, ax = plt.subplots(figsize=(6, 6))
# Hide both x and y-axis labels and ticks
  ax.set_xticks([])
  ax.set_yticks([])
  ax.set_xticklabels([])
  ax.set_yticklabels([])

  world_aeqd.plot(facecolor = "dimgrey", edgecolor = "silver", linewidth = 0.1, ax = ax)
  center.plot(color = "red", marker = "+", markersize = 75, ax = ax);

def get_plot_params():
  plot_params = {"centroid_color": "blue", 
                 "location_edgecolor": "sienna",
                 "location_facecolor": "tan",
                 "sec_edgecolor": "blue", 
                 "sec_facecolor": "none",
                 "sec_linestyle": "dashed",
                 "unc_line_color": "blue",
                 "vertex_color": "black",
                 "candidate_color": "yellow",
                 "nearest_point_color": "red",
                 "nearest_point_marker": "+",
                 "nearest_point_size": 75,
                 "nearest_segment_color": "blue",
                 "xlim_factor": 0.001,
                 "ylim_factor": 0.00005,
                 "aspect": "equal"
                 }
  return plot_params

def plot_geopick_location(location, params):
  if params is not None:
    p = params
  else:
    p = get_plot_params()

  fig, ax = plt.subplots(figsize=(6, 6)) 
  ax.set_aspect(p['aspect'])
  xmin = location.bounds['minx'].min() * 0.999
  xmax = location.bounds['maxx'].max() * 1.001
  ymin = location.bounds['miny'].min() * 0.99995
  ymax = location.bounds['maxy'].max() * 1.00005
  ax.set_xlim(xmin, xmax)
  ax.set_ylim(ymin, ymax)
  # ax.set_ylim(location.bounds['miny'].min(), location.bounds['maxy'].max())
  ctx.add_basemap(ax, crs=location.crs.to_string(), source=ctx.providers.OpenStreetMap.Mapnik)
  location.plot(aspect = p['aspect'], facecolor = "none", edgecolor = "blue", ax = ax)

def plot_geopick(sec, location, centroid, uncertainty_line, uncertainty_value, vertices, candidates, nearest_point, nearest_segment, basemap, xlim, ylim, params):
  if params is not None:
    p = params
  else:
    p = get_plot_params()
  fig, ax = plt.subplots(figsize=(6, 6))
  if xlim is not None:
    ax.set_xlim(xlim[0] * (1 - p["xlim_factor"]), xlim[1] * (1 + p['xlim_factor']))    
  if ylim is not None:
    ax.set_ylim(ylim[0] * (1 - p["ylim_factor"]), ylim[1] * (1 + p['ylim_factor']))    
  if basemap:
    ax.set_aspect(p['aspect'])
    xmin = location.bounds['minx'].min() * (1 - p["xlim_factor"])
    xmax = location.bounds['maxx'].max() * (1 + p["xlim_factor"])
    ymin = location.bounds['miny'].min() * (1 - p["ylim_factor"])
    ymax = location.bounds['maxy'].max() * (1 + p["ylim_factor"])

    ax.set_xlim(xmin, xmax)
    ax.set_ylim(ymin, ymax)
    # ax.set_ylim(location.bounds['miny'].min(), location.bounds['maxy'].max())
    ctx.add_basemap(ax, crs=location.crs.to_string(), source=ctx.providers.OpenStreetMap.Mapnik)
  if sec is not None:
    sec.plot(aspect = p['aspect'], facecolor = p['sec_facecolor'], edgecolor = p['sec_edgecolor'], linestyle = p['sec_linestyle'], ax = ax)
  if location is not None:
    location.plot(aspect = p['aspect'], facecolor = p['location_facecolor'], edgecolor = p['location_edgecolor'], ax = ax)
  if vertices is not None:
    vertices.plot(aspect = p['aspect'], color = p['vertex_color'], markersize = 10, ax = ax)
  if candidates is not None:
    candidates.plot(aspect = p['aspect'], color = p['candidate_color'], markersize = 20, ax = ax)    
  if nearest_point is not None:
    nearest_point.plot(aspect = p['aspect'], color = p['nearest_point_color'], 
                       marker = p['nearest_point_marker'],
                       markersize = p['nearest_point_size'], ax = ax)    
  if nearest_segment is not None:
    nearest_segment.plot(aspect = p['aspect'], color = p['nearest_segment_color'], markersize = 20, linestyle = "dotted", ax = ax)
  if centroid is not None:
    centroid.plot(aspect = p['aspect'], color = p['centroid_color'], markersize = 20, ax = ax)
  if uncertainty_line is not None:
    uncertainty_line.plot(aspect = p['aspect'], color = p['unc_line_color'], markersize = 20, linestyle = "dotted", ax = ax)
  if uncertainty_value is not None:
    ax.annotate(uncertainty_value, xy=(uncertainty_line.centroid.x[0], uncertainty_line.centroid.y[0]),
              xytext=(0, 0), textcoords='offset points', fontsize=12, ha='center', va='center',
              bbox=dict(facecolor='white', alpha=1, edgecolor='black'))

