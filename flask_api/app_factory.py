"""Flask application factory for GeoPick API."""

from __future__ import annotations

from flask import Flask, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from flask_api import settings
from flask_api.commands import custom_commands
from flask_api.models import db
from flask_api.routes.v1 import v1_bp
from flask_api.security import maybe_inject_internal_auth


def create_app() -> Flask:
    """Create and configure the GeoPick Flask application."""
    app = Flask(__name__)
    CORS(app)

    app.config["JWT_SECRET_KEY"] = settings.JWT_SECRET
    app.config["SQLALCHEMY_DATABASE_URI"] = settings.SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = settings.SQLALCHEMY_TRACK_MODIFICATIONS

    JWTManager(app)
    db.init_app(app)
    Migrate(app, db)

    @app.before_request
    def auth_middleware() -> None:
        maybe_inject_internal_auth(request)

    app.register_blueprint(v1_bp)
    app.cli.add_command(custom_commands.create_superuser)

    return app
