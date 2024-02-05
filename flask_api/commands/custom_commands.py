import click
from flask.cli import with_appcontext
from flask_api.models import User, db
from pathlib import Path
from os.path import join, dirname
from dotenv import load_dotenv
import os
import hashlib
from sqlalchemy.exc import IntegrityError

upper_dir = (Path(dirname(__file__))).parent.parent.absolute()
dotenv_path = join(upper_dir, '.env')
load_dotenv(dotenv_path)

def hash_password(password):
    password_bytes = password.encode('utf-8')
    hash_object = hashlib.sha256(password_bytes)
    return hash_object.hexdigest()

@click.command(name='create_superuser')
@with_appcontext
def create_superuser():
    """Initializes the database with the initial super user"""    
    try:
        username = os.environ.get('USERNAME')
        password = os.environ.get('PASSWORD')
        user = User(
            username=username,
            password=hash_password(password),
        )
        db.session.add(user)
        db.session.commit()
        click.echo('Created superuser!')
    except IntegrityError:
        click.echo('Superuser already exists!')            