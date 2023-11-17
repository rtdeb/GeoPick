import os
from pathlib import Path
from os.path import join, dirname
from dotenv import load_dotenv
import json

from flask_api.app import app as t

env_dir = (Path(dirname(__file__))).parent.parent.absolute()


def test_env_file_present():
    dotenv_path = join(env_dir, '.env')
    load_dotenv(dotenv_path)
    assert os.path.isfile(dotenv_path)


def test_api_version():
    package_path = join(env_dir, 'package.json')
    f = open(package_path)
    package_json = json.load(f)
    v = package_json['version']
    with t.test_client() as c:
        rv = c.post('/auth', json={
            'username': os.environ.get('USERNAME'), 'password': os.environ.get('PASSWORD')
        })
        json_response = json.loads(rv.data)
        token = json_response['token']
        rversion = c.get('/version', headers={'Authorization' : 'Bearer ' + token})
        json_response = json.loads(rversion.data)
        assert json_response['version'] == v

def test_api_auth():
    with t.test_client() as c:
        rv = c.post('/auth', json={
            'username': os.environ.get('USERNAME'), 'password': os.environ.get('PASSWORD')
        })
        json_response = json.loads(rv.data)
        print(json_response)
        assert json_response['success']
