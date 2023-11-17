import hashlib

def hash_password(password):
    password_bytes = password.encode('utf-8')
    hash_object = hashlib.sha256(password_bytes)
    return hash_object.hexdigest()

def db_create_user(db, username, password):
    cursor = db.cursor()
    cursor.execute("INSERT INTO users (username, password) VALUES (?,?)", (username, hash_password(password)))
    db.commit()
    retval = cursor.lastrowid
    db.close()
    return retval

def db_get_user(db, username, password):
    cursor = db.cursor()
    user = cursor.execute("SELECT * from users where username=? and password=?", (username, hash_password(password))).fetchone()
    return user

def db_get_user_by_id(db, id):
    cursor = db.cursor()
    user = cursor.execute("SELECT * from users where id=?", (id,)).fetchone()
    return user
