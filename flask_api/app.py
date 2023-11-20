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
from flask_api.dbutils import db_create_user, db_get_user, db_get_user_by_id


upper_dir = (Path(dirname(__file__))).parent.absolute()

dotenv_path = join(upper_dir, '.env')
package_path = join(upper_dir, 'package.json')
database_file = os.path.join(dirname(__file__), 'db')


load_dotenv(dotenv_path)

f = open(package_path)
package_json = json.load(f)
v = package_json['version']

app = Flask(__name__)
CORS(app)
app.config['JWT_SECRET_KEY'] = os.environ.get('SECRET')
jwt = JWTManager(app)


def init_db():
    with app.app_context():
        # create db file
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()
        # create initial user
        username = os.environ.get('USERNAME')
        password = os.environ.get('PASSWORD')
        db_create_user(db, username, password)



def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(database_file)
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


if not os.path.exists(database_file):
    init_db()

@app.before_request
def middleware():
    http_origin = request.environ.get('HTTP_ORIGIN','')
    if request.environ['REQUEST_METHOD'] != 'OPTIONS':
        if os.environ.get('API_REQUEST_ORIGINS') == http_origin:
            access_token = create_access_token(identity=1, expires_delta=datetime.timedelta(days=1))
            request.environ["HTTP_AUTHORIZATION"] = f"Bearer " + access_token


@app.route('/sec', methods=['POST'])
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

@app.route('/version', methods=['GET'])
@jwt_required()
def version():
    return jsonify({'version': v})


@app.route("/user", methods=["POST"])
@jwt_required()
def create_user():
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    current_user_id = get_jwt_identity()
    author = db_get_user_by_id(get_db(),current_user_id)
    if author[1] == os.environ.get('USERNAME'):
        try:
            user_id = db_create_user(get_db(),username, password)
        except sqlite3.IntegrityError as i:
            return json.dumps({"success": False, "msg": "username exists"}), 400, {'ContentType': 'application/json'}
        except Exception as e:
            return json.dumps({"success": False, "msg": str(e)}), 400, {'ContentType': 'application/json'}
        return jsonify({"success": True, "msg": "User created", "id": user_id})
    else:
        return jsonify({"success": False, "msg": "Not allowed"}), 401


@app.route("/auth", methods=["POST"])
def auth_user():
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    user = db_get_user(get_db(), username, password)
    if user is not None:
        access_token = create_access_token(identity=user[0], expires_delta=datetime.timedelta(days=1))
        return jsonify({"success": True, "msg": "User retrieved", "id": user[0], "token": access_token})
    else:
        return json.dumps({"success": False, "msg": "No user with these credentials exist"}), 404, {'ContentType': 'application/json'}


if __name__ == '__main__':
    app.run(debug=False, port=os.environ.get('PORT'))

