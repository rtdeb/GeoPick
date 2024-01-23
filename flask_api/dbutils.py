import hashlib
from flask_api.models import User, SharedGeoreference

def hash_password(password):
    password_bytes = password.encode('utf-8')
    hash_object = hashlib.sha256(password_bytes)
    return hash_object.hexdigest()

def db_get_georef(db, geopick_id):
    query = db.session.query(SharedGeoreference)
    query = query.filter(SharedGeoreference.geopick_id == geopick_id)
    if not db.session.query(query.exists()).scalar():
        return None    
    return query.first()

def db_create_georef(db, geopick_id, georef_data):
    georef = SharedGeoreference(
        geopick_id=geopick_id,
        georef_data=georef_data
    )
    db.session.add(georef)
    db.session.commit()
    return georef

def db_create_user(db, username, password):
    user = User(
        username=username,
        password=hash_password(password),
    )
    db.session.add(user)
    db.session.commit()
    return user

def db_get_user(db, username, password):
    query = db.session.query(User)
    query = query.filter(User.username == username)
    query = query.filter(User.password == hash_password(password))
    if not db.session.query(query.exists()).scalar():
        return None    
    return query.first()