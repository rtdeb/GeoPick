import geopick as gp
import geopandas as gpd
kk = """{"type": "Feature", "properties": {}, "geometry": {"type": "LineString", "coordinates": [[-82, 67], [-53, 70], [-44, 71]]}}"""
location = gpd.read_file(kk, driver = "GeoJSON")
location
gp.json_to_geoseries(kk)


