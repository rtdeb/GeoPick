from flask import Flask, request
import py.geopick as gp
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/sec', methods=['POST'])
def sec():
  json_location = request.get_json()
  json_location = str(json_location)
  json_location = json_location.replace("'", "\"")
  if json_location[0] == "[":
    json_location = json_location[1:len(json_location) - 1]
  location_wgs84 = gp.json_to_geoseries(json_location)
  georeference_json = gp.get_json_georeference(location_wgs84)
  response = georeference_json
  return response

if __name__ == '__main__':
    app.run(debug=False, port=8000)

