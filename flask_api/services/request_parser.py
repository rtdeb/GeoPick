"""Request parsing helpers for geospatial endpoints."""

from __future__ import annotations

import json
from typing import Any

from flask import Request


def parse_geojson_payload(request_obj: Request) -> str:
    """Parse incoming JSON payload into a GeoJSON string expected by geopandas.

    Keeps current backward-compatible behavior for both object and single-item
    array payloads.
    """
    payload: Any = request_obj.get_json()
    if payload is None:
        return "{}"

    if isinstance(payload, list) and len(payload) == 1:
        return json.dumps(payload[0])

    return json.dumps(payload)
