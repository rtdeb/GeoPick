from flask import Flask, request, jsonify
import geopick as gp
import geopandas as gpd
import shapely

app = Flask(__name__)
app.debug = False
@app.route('/sec', methods=['POST'])
def sec():
    data = request.get_json()
    data = data['geometry']    
    if 'wkt' in data:
        location_wkt = data['wkt']
        location_wgs84 = gpd.GeoSeries(shapely.wkt.loads(location_wkt))
        location_wgs84.crs = "EPSG:4326"

        georef = gp.get_json_georeference(location_wgs84)
        if georef is None:
          georef = "None"

        return jsonify({"georeference": georef})
    else:
      print(data)
      return data
      location = gp.json_to_geoseries(data)
      print(2)
      georef = gp.get_json_georeference(location)  
      print(3)
      return jsonify({"georeference": georef})
      print(4)
if __name__ == '__main__':
    app.run(debug=True)

# TESTING EXTERNALLY FROM THE COMMAND SHELL
# curl -X POST -H "Content-Type: application/json" -d '{"wkt": "POINT (2 42)"}' http://127.0.0.1:5000/sec
# curl -X POST -H "Content-Type: application/json" -d '{"wkt": "LINESTRING (2.0 42.0, 4.0 42.0, 3.1 41.0)"}' http://127.0.0.1:5000/sec
# curl -X POST -H "Content-Type: application/json" -d '{"wkt": "MULTILINESTRING ((2.0 42.0, 4.0 42.0, 3.1 41.0),(10 25, 15 35, 20 40))"}' http://127.0.0.1:5000/sec
# curl -X POST -H "Content-Type: application/json" -d '{"wkt": "POLYGON ((-3.334351 40.842905, -3.713379 40.010787, -2.675171 39.3088, -1.532593 40.103286, -1.82373 40.747257, -2.565308 41.104191, -3.334351 40.842905))"}' http://127.0.0.1:5000/sec
# curl -X POST -H "Content-Type: application/json" -d '{"wkt": "MULTIPOLYGON (((2.0 42.0, 4.0 42.0, 3.1 41.0, 2 42.0), (3 50, 4 60, 1 30, 3 50)))"}' http://127.0.0.1:5000/sec

# curl -X POST -H "Content-Type: application/json" -d '"""{"type": "Feature","properties": {},"geometry": {"type": "LineString","coordinates": [[-82, 67],[-53, 70],[-44, 71]]}}"""' http://127.0.0.1:5000/sec

# curl -X POST -H "Content-Type: application/json" -d '{"type": "Feature", "properties": {}, "geometry": {"type": "LineString", "coordinates": [[-82, 67], [-53, 70], [-44, 71]]}}' http://127.0.0.1:5000/sec

