"""GeoPick Flask app entrypoint.

The `app` object is preserved for compatibility with tests and existing
Flask/Gunicorn invocation patterns.
"""

from flask_api import settings
from flask_api.app_factory import create_app

app = create_app()


if __name__ == "__main__":
    app.run(debug=False, port=settings.API_PORT)
