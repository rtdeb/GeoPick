"""Centralized runtime settings and metadata loading for GeoPick API."""

from __future__ import annotations

import json
import os
from os.path import dirname, join
from pathlib import Path
from typing import Any, Dict

from dotenv import load_dotenv

PROJECT_ROOT = Path(dirname(__file__)).parent.absolute()
DOTENV_PATH = join(PROJECT_ROOT, ".env")
PACKAGE_JSON_PATH = join(PROJECT_ROOT, "package.json")

# Load environment once at module import.
load_dotenv(DOTENV_PATH)


def load_package_metadata() -> Dict[str, Any]:
    """Return package metadata from package.json."""
    with open(PACKAGE_JSON_PATH, "r", encoding="utf-8") as package_file:
        return json.load(package_file)


PACKAGE_METADATA = load_package_metadata()
APP_VERSION = PACKAGE_METADATA["version"]
API_VERSION = PACKAGE_METADATA["version-api"]


JWT_SECRET = os.environ.get("SECRET")
SQLALCHEMY_DATABASE_URI = os.environ.get("SQLALCHEMY_DATABASE_URI")
SQLALCHEMY_TRACK_MODIFICATIONS = False
API_PORT = os.environ.get("API_PORT")
API_REQUEST_ORIGINS = os.environ.get("API_REQUEST_ORIGINS")
ADMIN_USERNAME = os.environ.get("USERNAME")
ADMIN_PASSWORD = os.environ.get("PASSWORD")
