from datetime import datetime, timezone
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
import time

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

@app.before_request
def middleware():
    http_origin = request.environ.get('HTTP_ORIGIN','origin')
    http_referer = request.environ.get('HTTP_REFERER','referer')    
    if request.environ['REQUEST_METHOD'] != 'OPTIONS':
        if os.environ.get('API_REQUEST_ORIGINS') == http_origin or http_referer.startswith(http_origin):
            access_token = create_access_token(identity=1, expires_delta=datetime.timedelta(days=1))
            request.environ["HTTP_AUTHORIZATION"] = f"Bearer " + access_token        


@app.route('/v1/georeference', methods=['POST'])
@jwt_required()
def write_georeference():    
    locationid = request.json.get("locationid", None)
    georef_data = request.json.get("georef_data", None)
    georef_data_str = json.dumps(georef_data)
    georef = db_create_georef(db, locationid, georef_data_str)
    return jsonify({"success": True, "msg": "Georef created", "id": georef.id })


@app.route('/v1/georeference/<geopick_id>', methods=['GET'])
# @jwt_required()
def read_georeference(geopick_id):
    shared_georef = db_get_georef(db, geopick_id)
    if shared_georef:
        return jsonify({"success": True, "msg": "Georef retrieved", "data": shared_georef.georef_data, "path": '/?share={0}'.format(geopick_id)})
    else:
        return jsonify({"success": False, "msg": "Not found"}), 404

@app.route('/v1/georeference', methods=['GET'])
@jwt_required()
def list_georeferences():
    current_user_id = get_jwt_identity()
    author = db.get_or_404(User, current_user_id)
    if author.username == os.environ.get('USERNAME'):
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per-page", 100, type=int)
        georefs = db_get_georef_page(db, page, per_page)
        results = {
            "results": [{"id": g.id, "geopick_id": g.geopick_id, "georef_data": g.georef_data} for g in georefs.items],
            "pagination": {
                "count": georefs.total,
                "page": page,
                "per_page": per_page,
                "pages": georefs.pages,
            },
        }
        return jsonify(results)
    else:
        return jsonify({"success": False, "msg": "Not allowed"}), 401

def parse_sec_request():
    json_location = request.get_json()
    json_location = str(json_location)
    json_location = json_location.replace("'", "\"")
    if json_location[0] == "[":
        json_location = json_location[1:len(json_location) - 1]
    location_wgs84 = gp.json_to_geoseries(json_location)
    return location_wgs84

def generate_location_id():
    now_utc = datetime.now(timezone.utc)
    timestamp_str = now_utc.strftime("%Y-%m-%dT%H:%M:%S.%fZ")[:-4]
    random_number = str(random.randint(100, 999))
    location_id = "geopick-api-" + v_api + "-" + timestamp_str + "Z-" + random_number
    return location_id
    
@app.route('/v1/sec', methods=['POST'])
@jwt_required()
def sec():
    location_wgs84 = parse_sec_request()
    georeference_json = gp.get_json_georeference(location_wgs84)
    response = georeference_json
    return response


@app.route('/v1/sec_dwc', methods=['POST'])
@jwt_required()
# Returns georeference in JSON in Darwin Core Standard
def sec_dwc():    
    location_wgs84 = parse_sec_request()
    georef = gp.get_georeference(location_wgs84)
    id = generate_location_id()
    decimalLongitude = georef[0].centroid[0].x
    decimalLatitude = georef[0].centroid[0].y
    coordinateUncertaintyInMeters = georef[1]
    geojson_sec = georef[2]
    pointRadiusSpatialFit = georef[3]
    response = jsonify({'locationID': id, 
                        'decimalLongitude': decimalLongitude, 'decimalLatitude': decimalLatitude,
                        'coordinateUncertaintyInMeters': coordinateUncertaintyInMeters,
                        'geojson_sec': json.loads(geojson_sec.to_json()),
                        'pointRadiusSpatialFit': pointRadiusSpatialFit})
    return response

@app.route('/v1/version', methods=['GET'])
@jwt_required()
def version():    
    return jsonify({'version': v})

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


@app.route("/v1/auth", methods=["POST"])
def auth_user():
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    user = db_get_user(db, username, password)
    if user is not None:
        access_token = create_access_token(identity=user.id, expires_delta=datetime.timedelta(days=1))
        return jsonify({"success": True, "msg": "User retrieved", "id": user.id, "token": access_token})
    else:
        return json.dumps({"success": False, "msg": "No user with these credentials exist"}), 404, {'ContentType': 'application/json'}
    
# Register custom command
app.cli.add_command(custom_commands.create_superuser)


if __name__ == '__main__':
    app.run(debug=False, port=os.environ.get('API_PORT'))

