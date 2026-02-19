"""Business logic helpers for building georeference API responses."""

from __future__ import annotations

import json
import random
from collections import OrderedDict
from datetime import datetime, timezone
from typing import Any, Dict

import flask_api.geopick as gp
from shapely.wkt import dumps

from flask_api import settings
from flask_api.dbutils import db_create_georef


def georeference_to_db(db, locationid: str, georeference_json: Dict[str, Any]) -> Dict[str, Any]:
    """Persist a georeference and return a simple success payload."""
    georef = db_create_georef(db, locationid, json.dumps(georeference_json))
    return {
        "success": True,
        "msg": "Georeference created",
        "locacationid": georef.id,
    }


def utc_timestamp() -> str:
    """Return timestamp in legacy API format."""
    now_utc = datetime.now(timezone.utc)
    timestamp_str = now_utc.strftime("%Y-%m-%dT%H:%M:%S.%fZ")[:-4]
    return timestamp_str + "Z"


def generate_location_id(timestamp_str: str) -> str:
    """Create location id in API legacy format."""
    random_number = str(random.randint(100, 999))
    return f"geopick-api-{settings.API_VERSION}-{timestamp_str}-{random_number}"


def is_lat_lon(lat: float, lon: float) -> bool:
    """Simple check to assume coordinates are in EPSG4326."""
    return not (lon > 180 or lon < -180 or lat > 90 or lat < -90)


def wkt_is_lat_lon(wkt) -> bool:
    """Check all geometry coordinates are in valid lat/lon ranges."""
    coords = wkt.get_coordinates()
    for _, row in coords.iterrows():
        if not is_lat_lon(row["y"], row["x"]):
            return False
    return True


def reorganize_sec_json(json_obj: Dict[str, Any]) -> Dict[str, Any]:
    """Convert SEC GeoJSON to legacy sec_representation feature list."""
    coordinates = json_obj["features"][0]["geometry"]["coordinates"]
    return {
        "sec_representation": [
            {
                "geometry": {
                    "coordinates": coordinates,
                    "type": "Polygon",
                },
                "properties": {},
                "type": "Feature",
            }
        ]
    }


def build_dwc_georeference_response(data: Dict[str, Any], location_wgs84) -> OrderedDict:
    """Build Darwin Core georeference response preserving current field contract."""
    locality = data.get("locality", "")
    georeferenced_by = data.get("georeferencedBy", "")
    georeference_remarks = data.get("georeferenceRemarks", "")

    georef = gp.get_georeference(location_wgs84)
    decimal_longitude = georef[0].centroid[0].x
    decimal_latitude = georef[0].centroid[0].y
    georeference_date = utc_timestamp()
    locationid = generate_location_id(georeference_date)
    coordinate_uncertainty_m = georef[1]

    georef_json = json.loads(georef[2].to_json())
    sec_representation = reorganize_sec_json(georef_json)["sec_representation"]
    point_radius_spatial_fit = georef[3]

    if location_wgs84.iloc[0].geom_type.lower() in ("polygon", "multipolygon"):
        footprint_spatial_fit = 1
    else:
        footprint_spatial_fit = ""

    share_link = f"{settings.API_REQUEST_ORIGINS}/?locationid={locationid}"

    return OrderedDict(
        [
            ("locationID", locationid),
            ("locality", locality),
            ("decimalLongitude", round(decimal_longitude, 7)),
            ("decimalLatitude", round(decimal_latitude, 7)),
            ("coordinatePrecision", 0.0000001),
            ("geodeticDatum", "EPSG:4326"),
            ("coordinateUncertaintyInMeters", round(coordinate_uncertainty_m, 1)),
            ("sec_representation", sec_representation),
            ("pointRadiusSpatialFit", point_radius_spatial_fit),
            ("footprintWKT", dumps(location_wgs84[0])),
            ("footprintSRS", "EPSG:4326"),
            ("footprintSpatialFit", footprint_spatial_fit),
            ("georeferencedDate", georeference_date),
            ("georeferenceSources", f"GeoPick v.{settings.APP_VERSION}"),
            (
                "georeferenceProtocol",
                "Georeferencing Quick Reference Guide (Zermoglio et al. 2020, https://doi.org/10.35035/e09p-h128)",
            ),
            ("georeferencedBy", georeferenced_by),
            ("georeferenceRemarks", georeference_remarks),
            ("shareLink", share_link),
        ]
    )
