import geopandas as gpd
import geopick as gp
import pathlib
import shapely
import warnings
warnings.filterwarnings('ignore')

f_wkt = "data/capdecreus.wkt"
location_wkt = pathlib.Path(f_wkt).read_text()
location_wgs84 = gpd.GeoSeries(shapely.wkt.loads(location_wkt))
location_wgs84.crs = "EPSG:4326"

georef = gp.get_georeference(location_wgs84)
georeference = gp.print_georeference(georef, False)
print(georeference)
