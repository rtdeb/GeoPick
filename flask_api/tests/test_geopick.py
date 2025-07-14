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
    v_api = package_json['version-api']
    with t.test_client() as c:
        rv = c.post('/v1/authenticate', json={
            'username': os.environ.get('USERNAME'), 'password': os.environ.get('PASSWORD')
        })
        json_response = json.loads(rv.data)
        token = json_response['token']
        rversion = c.get('/v1/version', headers={'Authorization': 'Bearer ' + token})
        json_response = json.loads(rversion.data)
        assert json_response['version-api'] == v_api


def test_api_auth():
    with t.test_client() as c:
        rv = c.post('/v1/authenticate', json={
            'username': os.environ.get('USERNAME'), 'password': os.environ.get('PASSWORD')
        })
        json_response = json.loads(rv.data)
        print(json_response)
        assert json_response['success']


def test_post_sec():
    with t.test_client() as c:
        rv = c.post('/v1/authenticate', json={
            'username': os.environ.get('USERNAME'), 'password': os.environ.get('PASSWORD')
        })
        json_response = json.loads(rv.data)
        token = json_response['token']
        clockwise_geom = {
            "geometry": {
                "coordinates": [
                    [
                        [2.878418, 40.979898],
                        [4.064941, 40.010787],
                        [1.142578, 39.3173],
                        [1.07666, 40.663973],
                        [2.878418, 40.979898]
                    ]
                ],
                "type": "Polygon"
            },
            "properties": {},
            "type": "Feature"
        }
        counter_clockwise_geom = {
            "geometry": {
                "coordinates": [
                    [
                        [2.25769, 40.979898],
                        [2.125854, 40.618122],
                        [2.807007, 40.5931],
                        [3.169556, 40.805494],
                        [2.25769, 40.979898]
                    ]
                ],
                "type": "Polygon"
            },
            "properties": {},
            "type": "Feature"
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer {0}".format(token)
        }
        rv = c.post('/v1/sec', json=counter_clockwise_geom, headers=headers)
        json_response = json.loads(rv.data)
        assert rv.status == '200 OK'
