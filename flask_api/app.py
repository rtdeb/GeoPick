import datetime

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
from flask_api.dbutils import db_create_user, db_get_user
from flask_api.models import User, db
from flask_migrate import Migrate
from flask_api.commands import custom_commands
from sqlalchemy.exc import IntegrityError


upper_dir = (Path(dirname(__file__))).parent.absolute()

dotenv_path = join(upper_dir, '.env')
package_path = join(upper_dir, 'package.json')

load_dotenv(dotenv_path)

f = open(package_path)
package_json = json.load(f)
v = package_json['version']

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
    http_origin = request.environ.get('HTTP_ORIGIN','')
    if request.environ['REQUEST_METHOD'] != 'OPTIONS':
        if os.environ.get('API_REQUEST_ORIGINS') == http_origin:
            access_token = create_access_token(identity=1, expires_delta=datetime.timedelta(days=1))
            request.environ["HTTP_AUTHORIZATION"] = f"Bearer " + access_token


@app.route('/v1/sec', methods=['POST'])
@jwt_required()
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

