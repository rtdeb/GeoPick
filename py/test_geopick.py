import pathlib
import geopick as gp
import geopandas as gpd
import shapely

f_wkt = "data/wkt_different_than_geopickR.txt"
location_wkt = pathlib.Path(f_wkt).read_text()

location_wkt = "POLYGON ((-2.834473 40.237605, -2.197266 41.037931, -1.746826 40.346544, -2.834473 40.237605))"
location_wkt = "POINT (2 42)"
location_wkt = "MULTIPOLYGON (((-2.834473 40.237605, -2.197266 41.037931, -1.746826 40.346544, -2.834473 40.237605)), ((-0.109863 40.838749, -0.153809 40.111689, 0.296631 40.680638, -0.109863 40.838749)))"
location_wkt = "POLYGON ((2 42, 4 42, 3 41, 2 42))"
location_wgs84 = gpd.GeoSeries(shapely.wkt.loads(location_wkt))
location_wgs84.crs = "EPSG:4326"

georef = gp.get_georeference(location_wgs84)
if georef is None:
  print("WKT is of point type, nothing to do!")
else:
  print("Latitude:", round(georef[0].iloc[0].x, 7), ", Longitude:", round(georef[0].iloc[0].y, 7))
  print("Uncertainty:", round(georef[1]), "m")

