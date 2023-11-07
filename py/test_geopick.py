import pathlib
import geopick as gp
import geopandas as gpd
import shapely

# f_wkt = "../data/wkt_different_than_geopickR.txt"
# location_wkt = pathlib.Path(f_wkt).read_text()

# TEST USING WKT AS INPUT
# location_wkt = "POINT (2 42)"
# location_wkt = "LINESTRING (2.0 42.0, 4.0 42.0, 3.1 41.0)"
# location_wkt = "MULTILINESTRING ((2.0 42.0, 4.0 42.0, 3.1 41.0),(10 25, 15 35, 20 40))"
# location_wkt = "POLYGON ((-3.334351 40.842905, -3.713379 40.010787, -2.675171 39.3088, -1.532593 40.103286, -1.82373 40.747257, -2.565308 41.104191, -3.334351 40.842905))"
# location_wkt = "MULTIPOLYGON (((2.0 42.0, 4.0 42.0, 3.1 41.0, 2 42.0), (3 50, 4 60, 1 30, 3 50)))"
# location_wkt = "POLYGON ((2.864685 40.469935, 3.652954 40.540939, 3.188782 39.86548, 2.864685 40.469935))"
location_wkt = "POLYGON ((4.298967 39.831525, 4.302463 39.831981, 4.301806 39.832417, 4.30117 39.832516, 4.300434 39.832888, 4.300219 39.833024, 4.299835 39.833137, 4.29955 39.83298, 4.29952 39.832675, 4.299406 39.832212, 4.298967 39.831525))"
location_wkt = "MULTIPOLYGON (((-18.808594 53.435719, -19.863281 47.872144, -8.613281 48.341646, -8.4375 53.956086, -18.808594 53.435719)), ((2.8125 53.540307, 2.8125 48.224673, 14.0625 48.224673, 12.65625 54.572062, 2.8125 53.540307)))"
location_wgs84 = gpd.GeoSeries(shapely.wkt.loads(location_wkt))
location_wgs84.crs = "EPSG:4326"
georeference_json = gp.get_json_georeference(location_wgs84)
georeference_json

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
json_salgar = """
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [4.298967, 39.831525],
            [4.302463, 39.831981],
            [4.301806, 39.832417],
            [4.30117, 39.832516],
            [4.300434, 39.832888],
            [4.300219, 39.833024],
            [4.299835, 39.833137],
            [4.29955, 39.83298],
            [4.29952, 39.832675],
            [4.299406, 39.832212],
            [4.298967, 39.831525]
          ]
        ]
      },
      "properties": {}
    }
  ]
}
"""
json_location = json_point
json_location = json_linestring
json_location = json_multilinestring
json_location = json_polygon
json_location = json_multipolygon
json_location = json_salgar
json_location


location_wgs84 = gp.json_to_geoseries(json_location)
georeference_json = gp.get_json_georeference(location_wgs84)
georeference_json

# georeference_json

json = "[{'type': 'Feature', 'properties': {}, 'geometry': {'type': 'LineString', 'coordinates': [[-72.070313, 54.265224], [13.359375, 74.116047]]}}]"
