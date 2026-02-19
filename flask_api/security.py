"""Security-related helpers shared by API and CLI commands."""

from __future__ import annotations

import hashlib
from datetime import timedelta
from typing import Optional

from flask import Request
from flask_jwt_extended import create_access_token

from flask_api import settings


def hash_password(password: str) -> str:
    """Return SHA-256 digest used by the legacy user model."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def maybe_inject_internal_auth(request_obj: Request) -> None:
    """Attach a short-lived JWT for trusted first-party requests.

    This preserves the current production behavior where browser requests
    originating from trusted origins can use protected API endpoints without
    explicitly authenticating first.
    """
    if request_obj.environ.get("REQUEST_METHOD") == "OPTIONS":
        return

    http_origin = request_obj.environ.get("HTTP_ORIGIN", "origin")
    http_referer = request_obj.environ.get("HTTP_REFERER", "referer")

    trusted_origin: Optional[str] = settings.API_REQUEST_ORIGINS
    should_authorize = False

    if http_origin in ("origin", ""):
        should_authorize = trusted_origin is None or http_referer.startswith(
            trusted_origin
        )
    else:
        should_authorize = (
            trusted_origin == http_origin or http_referer.startswith(http_origin)
        )

    if should_authorize:
        token = create_access_token(identity=1, expires_delta=timedelta(days=1))
        request_obj.environ["HTTP_AUTHORIZATION"] = f"Bearer {token}"
