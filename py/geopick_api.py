from flask import Flask, request, jsonify
import geopick as gp
import geopandas as gpd
import shapely

app = Flask(__name__)

@app.route('/sec', methods=['POST'])
def sec():
    data = request.get_json()
    if 'wkt' in data:
        location_wkt = data['wkt']
        location_wgs84 = gpd.GeoSeries(shapely.wkt.loads(location_wkt))
        location_wgs84.crs = "EPSG:4326"

        georef = gp.get_georeference(location_wgs84)
        if georef is None:
          georef = "None"

        return jsonify({"georeference": georef})
    else:
        return jsonify({"error": "Missing 'WKT string' in the request."}), 400

if __name__ == '__main__':
    app.run(debug=True)

# curl -X POST -H "Content-Type: application/json" -d '{"wkt": "POINT (2 42)"}' http://127.0.0.1:5000/sec
# curl -X POST -H "Content-Type: application/json" -d '{"wkt": "POLYGON ((2 42, 4 42, 3 41, 2 42))"}' http://127.0.0.1:5000/sec
