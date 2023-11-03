import pathlib
import geopick as gp
import geopandas as gpd
import shapely

f_wkt = "../data/wkt_different_than_geopickR.txt"
location_wkt = pathlib.Path(f_wkt).read_text()

# TEST USING WKT AS INPUT
# location_wkt = "POINT (2 42)"
# location_wkt = "LINESTRING (2.0 42.0, 4.0 42.0, 3.1 41.0)"
# location_wkt = "MULTILINESTRING ((2.0 42.0, 4.0 42.0, 3.1 41.0),(10 25, 15 35, 20 40))"
# location_wkt = "POLYGON ((-3.334351 40.842905, -3.713379 40.010787, -2.675171 39.3088, -1.532593 40.103286, -1.82373 40.747257, -2.565308 41.104191, -3.334351 40.842905))"
# location_wkt = "MULTIPOLYGON (((2.0 42.0, 4.0 42.0, 3.1 41.0, 2 42.0), (3 50, 4 60, 1 30, 3 50)))"

# location_wgs84 = gpd.GeoSeries(shapely.wkt.loads(location_wkt))
# location_wgs84.crs = "EPSG:4326"
# georeference_json = gp.get_json_georeference(location_wgs84)
# georeference_json

# TEST USING GEOJSON AS INPUT
# Point
json_point = """
{
  "type": "Feature",
  "properties" :{},
  "geometry": {
    "type": "Point",
    "coordinates": [-82.441406,67.575717]
  }
}
"""
# LineString
json_linestring = """
{
  "type": "Feature",
  "properties": {},
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-82, 67],
      [-53, 70], 
      [-44, 71]
    ]
  }
}
"""
# MultiLineString
json_multilinestring = """
{
  "type": "Feature",
  "properties": {},
  "geometry": {
    "type": "MultiLineString",
    "coordinates": [
      [
        [-82, 67],
        [-53, 70],
        [-44, 71]
      ],
      [
        [-32, 27],
        [-13, 7],
        [-4, 1]
      ]
    ]
  }
}
"""
# Polygon
json_polygon = """
{
  "type": "Feature",
  "properties": {},
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [-82, 67],
        [-53, 70],
        [-44, 71],
        [-82, 67]
      ]      
    ]
  }
}
"""

# MultiPolygon
json_multipolygon = """
{
  "type": "Feature",
  "properties": {},
  "geometry": {
    "type": "MultiPolygon",
    "coordinates": [
      [
        [
          [-82, 67],
          [-53, 70],
          [-44, 71],
          [-82, 67]
        ]
      ],
      [
        [
          [-2, 47],
          [-5, 7],
          [-4, 31],
          [-2, 47]
        ]
      ]      
    ]
  }
}
"""

json_location = json_point
json_location = json_linestring
json_location = json_multilinestring
json_location = json_polygon
json_location = json_multipolygon

location_wgs84 = gp.json_to_geoseries(json_location)
georeference_json = gp.get_json_georeference(location_wgs84)
georeference_json

