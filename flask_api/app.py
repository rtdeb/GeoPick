from datetime import datetime, timezone, timedelta
import random
from flask import Flask, request, jsonify, g
import sqlite3
import flask_api.geopick as gp
from flask_cors import CORS
from os.path import join, dirname
from pathlib import Path
from dotenv import load_dotenv
import os
import json
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from flask_jwt_extended import get_jwt_identity
from flask_api.dbutils import db_create_user, db_get_user, db_create_georef, db_get_georef, db_get_georef_page
from flask_api.models import User, db
from flask_migrate import Migrate
from flask_api.commands import custom_commands
from sqlalchemy.exc import IntegrityError
from shapely.wkt import dumps
from shapely.geometry import Polygon, MultiPolygon, LineString, MultiLineString
import time
from collections import OrderedDict

upper_dir = (Path(dirname(__file__))).parent.absolute()

dotenv_path = join(upper_dir, '.env')
package_path = join(upper_dir, 'package.json')

load_dotenv(dotenv_path)

f = open(package_path)
package_json = json.load(f)
v = package_json['version']
v_api = package_json['version-api']

app = Flask(__name__)
CORS(app)
app.config['JWT_SECRET_KEY'] = os.environ.get('SECRET')
jwt = JWTManager(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable modification tracking

db.init_app(app)
migrate = Migrate(app, db)

##### FUNCTIONS =================================================================== #
# Writes a georeferenced locality, a spatial geometry, to the database.
def georeferenceToDB(locationid, georeference_json):
    georef = db_create_georef(db, locationid, json.dumps(georeference_json))
    return jsonify({"success": True, "msg": "Georeference created", "locacationid": georef.id })

def parse_sec_request():
    json_location = request.get_json()
    json_location = str(json_location)
    json_location = json_location.replace("'", "\"")
    if json_location[0] == "[":
        json_location = json_location[1:len(json_location) - 1]    
    return json_location

def getUTC():
    now_utc = datetime.now(timezone.utc)
    timestamp_str = now_utc.strftime("%Y-%m-%dT%H:%M:%S.%fZ")[:-4]
    return timestamp_str + "Z"

def generate_location_id(timestamp_str):
    random_number = str(random.randint(100, 999))
    location_id = "geopick-api-" + v_api + "-" + timestamp_str + "-" + random_number
    return location_id

# Simple check to assume coordinates are in EPSG4326
def isLatLon(lat, lon): 
  ok = True
  if lon > 180 or lon < -180 or lat > 90 or lat < -90:
      ok = False
  return ok  

# Utility function to iterate oveer the coordinates of geometries
def iterate_coordinates(geometry):
    if geometry.geom_type == 'Polygon':
        for point in geometry.exterior.coords:
            yield point
    elif geometry.geom_type == 'MultiPolygon':
        for polygon in geometry.geoms:
            for point in polygon.exterior.coords:
                yield point
    elif geometry.geom_type == 'LineString':
        for point in geometry.coords:
            yield point
    elif geometry.geom_type == 'MultiLineString':
        for linestring in geometry.geoms:
            for point in linestring.coords:
                yield point

# Simple check of wkt being in epsg 4326
def wktIsLatLon(wkt):
    coords = wkt.get_coordinates()
    wktOK = True
    for index, row in coords.iterrows():
        if not isLatLon(row['y'], row['x']):
            wktOK = False
            break
    return wktOK

def cleanGeoJSON(json_obj):
    key_to_remove = 'features.bbox'
    if key_to_remove in json_obj:
        del json_obj[key_to_remove]
    cleaned_json_str = json.dumps(json_obj)
    return(cleaned_json_str)

def reorganizeJSON(json_obj):
    coordinates = json_obj["features"][0]["geometry"]["coordinates"]        
    json_georef = {
        "sec_representation": [
            {
                "geometry": {
                    "coordinates": coordinates,
                    "type": "Polygon"
                },
                "properties": {},
                "type": "Feature"
            }
        ]
    }    
    return json_georef

##### ENDPOINTS =================================================================== #
@app.before_request
def middleware():
    http_origin = request.environ.get('HTTP_ORIGIN','origin')
    http_referer = request.environ.get('HTTP_REFERER','referer')    
    if request.environ['REQUEST_METHOD'] != 'OPTIONS':
        if http_origin == 'origin' or http_origin == '': #HTTP_ORIGIN not present
            if os.environ.get('API_REQUEST_ORIGINS') is None or http_referer.startswith(os.environ.get('API_REQUEST_ORIGINS')):
                access_token = create_access_token(identity=1, expires_delta=timedelta(days=1))
                request.environ["HTTP_AUTHORIZATION"] = f"Bearer " + access_token        
        else:
            if os.environ.get('API_REQUEST_ORIGINS') == http_origin or http_referer.startswith(http_origin):
                access_token = create_access_token(identity=1, expires_delta=timedelta(days=1))
                request.environ["HTTP_AUTHORIZATION"] = f"Bearer " + access_token        

# ENDPOINT /v1/georeference ------------------------------------------------------- #
@app.route('/v1/georeference', methods=['POST'])
@jwt_required()
def write_georeference():    
    locationid = request.json.get("locationid", None)
    georef_data = request.json.get("georef_data", None)
    georef_json = georeferenceToDB(locationid, georef_data)
    return georef_json, 200

# ENDPOINT /v1/georeferences/<locationid> ----------------------------------------- #
@app.route('/v1/georeferences/<locationid>', methods=['GET'])
@jwt_required()
def read_georeference(locationid):
    shared_georef = db_get_georef(db, locationid)
    if shared_georef:
        return jsonify({"success": True, "msg": "Georeference retrieved", "data": shared_georef.georef_data, "path": '/?share={0}'.format(locationid)}), 200
    else:
        return jsonify({"success": False, "msg": "Not found"}), 404

# ENDPOINT /v1/georeferences ------------------------------------------------------ #
@app.route('/v1/georeferences', methods=['GET'])
@jwt_required()
def list_georeferences():
    current_user_id = get_jwt_identity()
    author = db.get_or_404(User, current_user_id)
    if author.username == os.environ.get('USERNAME'):
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per-page", 100, type=int)
        georefs = db_get_georef_page(db, page, per_page)
        results = {
            "results": [{"id": g.id, "locationid": g.locationid, "georef_data": json.loads(g.georef_data), "time_created": g.time_created} for g in georefs.items],
            "pagination": {
                "count": georefs.total,
                "page": page,
                "per_page": per_page,
                "pages": georefs.pages,
            },
        }
        results = jsonify(results)
        return results, 200
    else:
        return jsonify({"success": False, "msg": "Not allowed"}), 401

# ENDPOINT /v1/sec ---------------------------------------------------------------- #
# Given an incoming spatial geometry in GeoJSON format returns its complete point-radius georeference including its SEC, in a format to be consumed by the GeoPick application. This is a method intended to be used only by the GeoPick web application. To directly use the API please refer to the 'georeference-dwc' endpoint.
@app.route('/v1/sec', methods=['POST'])
@jwt_required()
def sec():
    json_location = parse_sec_request()
    location_wgs84 = gp.json_to_geoseries(json_location)
    georeference_json = gp.get_json_georeference(location_wgs84)
    response = georeference_json
    return response, 200

# ENDPOINT /v1/georeference-dwc --------------------------------------------------- #
# Given an incoming spatial geometry in WKT format returns its complete point-radius georeference including its SEC, in Darwin Core Standard. It adds to the DWC georeference an additional non-DWC field: the 'sec_representation' (polygonal representation as a WKT).
@app.route('/v1/georeference-dwc', methods=['POST'])
@jwt_required()
def georeference_dwc():        
    json_location = parse_sec_request()
    data = json.loads(json_location)
    if 'locality' in data:
        locality = data['locality']
    else:
        locality = ""
    if 'georeferencedBy' in data:
        georeferencedBy = data['georeferencedBy']
    else:
        georeferencedBy = ""        
    if 'georeferenceRemarks' in data:
        georeferenceRemarks = data['georeferenceRemarks']
    else:
        georeferenceRemarks = ""            
    location_wgs84 = gp.json_to_geoseries(json_location)
    if wktIsLatLon(location_wgs84):
        georef = gp.get_georeference(location_wgs84)
        decimalLongitude = georef[0].centroid[0].x
        decimalLatitude = georef[0].centroid[0].y  
        georeferenceDate = getUTC()  
        locationid = generate_location_id(georeferenceDate)
        coordinateUncertaintyInMeters = georef[1]
        georef_json = georef[2].to_json()
        georef_json = json.loads(georef_json)
        georef_json = reorganizeJSON(georef_json)['sec_representation']
        pointRadiusSpatialFit = georef[3]
        if location_wgs84.iloc[0].geom_type.lower() == 'polygon' or location_wgs84.iloc[0].geom_type.lower() == 'multipolygon':
            footprintSpatialFit = 1
        else:
            footprintSpatialFit = ""
        footprintWKT = dumps(location_wgs84[0])
        shareLink = os.environ.get('API_REQUEST_ORIGINS') + "/?locationid=" + locationid
        response = OrderedDict([
            ('locationID', locationid),
            ('locality', locality),
            ('decimalLongitude', round(decimalLongitude, 7)),
            ('decimalLatitude', round(decimalLatitude, 7)),
            ('coordinatePrecision', 0.0000001),
            ('geodeticDatum', "EPSG:4326"),
            ('coordinateUncertaintyInMeters', round(coordinateUncertaintyInMeters, 1)),
            ('sec_representation', georef_json),
            ('pointRadiusSpatialFit', pointRadiusSpatialFit),
            ('footprintWKT', footprintWKT),
            ('footprintSRS', "EPSG:4326"),
            ('footprintSpatialFit', footprintSpatialFit),
            ('georeferencedDate', georeferenceDate),
            ('georeferenceSources', "GeoPick v." + v),
            ('georeferenceProtocol', "Georeferencing Quick Reference Guide (Zermoglio et al. 2020, https://doi.org/10.35035/e09p-h128)"),
            ('georeferencedBy', georeferencedBy),
            ('georeferenceRemarks', georeferenceRemarks),
            ('shareLink', shareLink)
            ])
        json_string = json.dumps(response)
        georeferenceToDB(locationid, json.loads(json_string))
        return jsonify(response), 200
    else:
        response = {"Error": "Footprint geometry does not appear to be in EPSG:4326 (Lat/Lon). One or more longitude or latitude values are outside of their range. Valid ranges are: Longitude [-180, 180] and Latitude: [-90, 90]"}        
        return jsonify(response), 400

# ENDPOINT /v1/version ------------------------------------------------------------ #
@app.route('/v1/version', methods=['GET'])
@jwt_required()
def version():    
    return jsonify({'version-api': v_api})

# ENDPOINT /v1/user --------------------------------------------------------------- #
@app.route("/v1/user", methods=["POST"])
@jwt_required()
def create_user():
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    current_user_id = get_jwt_identity()
    author = db.get_or_404(User, current_user_id)
    if author.username == os.environ.get('USERNAME'):
        try:
            user = db_create_user(db, username, password)
            return jsonify({"success": True, "msg": "User created", "id": user.id})
        except IntegrityError as i:
            return json.dumps({"success": False, "msg": "username exists"}), 400, {'ContentType': 'application/json'}
        except Exception as e:
            return json.dumps({"success": False, "msg": str(e)}), 400, {'ContentType': 'application/json'}        
    else:
        return jsonify({"success": False, "msg": "Not allowed"}), 401

# ENDPOINT /v1/authenticate ------------------------------------------------------- #
@app.route("/v1/authenticate", methods=["POST"])
def auth_user():
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    user = db_get_user(db, username, password)
    if user is not None:
        access_token = create_access_token(identity=user.id, expires_delta=timedelta(days=1))
        return jsonify({"success": True, "msg": "User retrieved", "id": user.id, "token": access_token})
    else:
        return json.dumps({"success": False, "msg": "No user with these credentials exist"}), 404, {'ContentType': 'application/json'}
    
# Register custom command
app.cli.add_command(custom_commands.create_superuser)

if __name__ == '__main__':
    app.run(debug=False, port=os.environ.get('API_PORT'))

