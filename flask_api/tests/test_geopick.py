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
    with t.test_client() as c:
        rv = c.post('/auth', json={
            'username': os.environ.get('USERNAME'), 'password': os.environ.get('PASSWORD')
        })
        json_response = json.loads(rv.data)
        print(json_response)
        assert json_response['success']
