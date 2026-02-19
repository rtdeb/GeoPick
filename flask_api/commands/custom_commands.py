import click
from flask.cli import with_appcontext
from sqlalchemy.exc import IntegrityError

from flask_api import settings
from flask_api.models import User, db
from flask_api.security import hash_password


@click.command(name="create_superuser")
@with_appcontext
def create_superuser():
    """Initializes the database with the initial super user."""
    try:
        user = User(
            username=settings.ADMIN_USERNAME,
            password=hash_password(settings.ADMIN_PASSWORD),
        )
        db.session.add(user)
        db.session.commit()
        click.echo("Created superuser!")
    except IntegrityError:
        click.echo("Superuser already exists!")
