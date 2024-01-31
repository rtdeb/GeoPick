from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import func


db = SQLAlchemy()

from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    password = db.Column(db.String(120), unique=True, nullable=False)

class SharedGeoreference(db.Model):
    id = db.Column(db.Integer, primary_key=True)    
    # geopick-v1.1-20240118-1
    locationid = db.Column(db.String(300), unique=True, nullable=False)
    georef_data = db.Column(db.Text(), nullable=False)
    time_created = db.Column(db.DateTime(timezone=True), server_default=func.now())