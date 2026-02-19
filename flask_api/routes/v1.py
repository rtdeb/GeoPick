"""Version 1 API routes for GeoPick."""

from __future__ import annotations

import json

import flask_api.geopick as gp
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError

from flask_api import settings
from flask_api.dbutils import (
    db_create_user,
    db_get_georef,
    db_get_georef_page,
    db_get_user,
)
from flask_api.models import User, db
from flask_api.services.georeference_service import (
    build_dwc_georeference_response,
    georeference_to_db,
    wkt_is_lat_lon,
)
from flask_api.services.request_parser import parse_geojson_payload

v1_bp = Blueprint("v1", __name__, url_prefix="/v1")


@v1_bp.route("/georeference", methods=["POST"])
@jwt_required()
def write_georeference():
    """Persist shared georeference payload."""
    locationid = request.json.get("locationid", None)
    georef_data = request.json.get("georef_data", None)
    georef_json = georeference_to_db(db, locationid, georef_data)
    return jsonify(georef_json), 200


@v1_bp.route("/georeferences/<locationid>", methods=["GET"])
@jwt_required()
def read_georeference(locationid):
    """Retrieve georeference by location id."""
    shared_georef = db_get_georef(db, locationid)
    if shared_georef:
        return (
            jsonify(
                {
                    "success": True,
                    "msg": "Georeference retrieved",
                    "data": shared_georef.georef_data,
                    "path": "/?share={0}".format(locationid),
                }
            ),
            200,
        )
    return jsonify({"success": False, "msg": "Not found"}), 404


@v1_bp.route("/georeferences", methods=["GET"])
@jwt_required()
def list_georeferences():
    """List paginated georeferences for admin user."""
    current_user_id = get_jwt_identity()
    author = db.get_or_404(User, current_user_id)

    if author.username != settings.ADMIN_USERNAME:
        return jsonify({"success": False, "msg": "Not allowed"}), 401

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per-page", 100, type=int)
    georefs = db_get_georef_page(db, page, per_page)

    results = {
        "results": [
            {
                "id": g.id,
                "locationid": g.locationid,
                "georef_data": json.loads(g.georef_data),
                "time_created": g.time_created,
            }
            for g in georefs.items
        ],
        "pagination": {
            "count": georefs.total,
            "page": page,
            "per_page": per_page,
            "pages": georefs.pages,
        },
    }
    return jsonify(results), 200


@v1_bp.route("/sec", methods=["POST"])
@jwt_required()
def sec():
    """Calculate SEC georeference from GeoJSON input."""
    json_location = parse_geojson_payload(request)
    location_wgs84 = gp.json_to_geoseries(json_location)
    georeference_json = gp.get_json_georeference(location_wgs84)
    return georeference_json, 200


@v1_bp.route("/georeference-dwc", methods=["POST"])
@jwt_required()
def georeference_dwc():
    """Calculate SEC georeference and return Darwin Core payload."""
    json_location = parse_geojson_payload(request)
    data = json.loads(json_location)

    location_wgs84 = gp.json_to_geoseries(json_location)
    if not wkt_is_lat_lon(location_wgs84):
        return (
            jsonify(
                {
                    "Error": "Footprint geometry does not appear to be in EPSG:4326 (Lat/Lon). One or more longitude or latitude values are outside of their range. Valid ranges are: Longitude [-180, 180] and Latitude: [-90, 90]"
                }
            ),
            400,
        )

    response = build_dwc_georeference_response(data, location_wgs84)
    georeference_to_db(db, response["locationID"], json.loads(json.dumps(response)))
    return jsonify(response), 200


@v1_bp.route("/version", methods=["GET"])
@jwt_required()
def version():
    """Return API version."""
    return jsonify({"version-api": settings.API_VERSION})


@v1_bp.route("/user", methods=["POST"])
@jwt_required()
def create_user():
    """Create a new API user (admin only)."""
    username = request.json.get("username", None)
    password = request.json.get("password", None)

    current_user_id = get_jwt_identity()
    author = db.get_or_404(User, current_user_id)

    if author.username != settings.ADMIN_USERNAME:
        return jsonify({"success": False, "msg": "Not allowed"}), 401

    try:
        user = db_create_user(db, username, password)
        return jsonify({"success": True, "msg": "User created", "id": user.id})
    except IntegrityError:
        return (
            json.dumps({"success": False, "msg": "username exists"}),
            400,
            {"ContentType": "application/json"},
        )
    except Exception as error:
        return (
            json.dumps({"success": False, "msg": str(error)}),
            400,
            {"ContentType": "application/json"},
        )


@v1_bp.route("/authenticate", methods=["POST"])
def auth_user():
    """Authenticate user and return JWT."""
    username = request.json.get("username", None)
    password = request.json.get("password", None)

    user = db_get_user(db, username, password)
    if user is None:
        return (
            json.dumps(
                {"success": False, "msg": "No user with these credentials exist"}
            ),
            404,
            {"ContentType": "application/json"},
        )

    from datetime import timedelta
    from flask_jwt_extended import create_access_token

    access_token = create_access_token(identity=user.id, expires_delta=timedelta(days=1))
    return (
        jsonify(
            {
                "success": True,
                "msg": "User retrieved",
                "id": user.id,
                "token": access_token,
            }
        ),
        200,
    )
