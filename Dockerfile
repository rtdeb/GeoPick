FROM python:3.10-slim AS api

COPY requirements.txt package.json /srv/
COPY flask_api /srv/flask_api/

WORKDIR /srv/

RUN pip install -r requirements.txt --src /usr/local/src
RUN touch .env && pip install pyuwsgi --src /usr/local/src

CMD uwsgi --http-socket 0.0.0.0:8000 --wsgi-file flask_api/app.py --callable app --processes 4 --threads 2

# Run tests
FROM api AS test

ENV USERNAME=testusername
ENV PASSWORD=testpassword
ENV SECRET=testsecret
ENV DATABASE_FILE=testdb.sqlite3

#sqlite3 testdb.sqlite3 < flask_api/schema.sql
#echo "INSERT INTO users (username, password) VALUES ('testusername','9f735e0df9a1ddc702bf0a1a7b83033f9f7153a00c29de82cedadc9957289b05')" | sqlite3 testdb.sqlite3
#gzip -c /tmp/db.sqlite3 | base64
RUN echo 'H4sICPXycWUAA2RiLnNxbGl0ZTMA7dq/a8JAFAfwO+1PwdotU+GWgqKUmBBitqYlFNsYNY20TuWSXECoWk2kQyf/oP57nXuJlKJLVynfD/eOe3l5uflBHofuJBMsmS+nPGM6OSeUkmvGCCElGWXyi8o42Mn/UiJXT/fV/FC7ILW53AAAAAAAAAD2zaB0pDSbdJzx8FWki1c5Kb+kYrESs2g3Ld/6jh04LLBvXIftFOszPhUtmTXWZ/RYURS6/ii+uUrFMi220lZ/8YjVK0yaxKzrBc6d47OB3+3Z/pg9OGNmj4J+15NdPccLWsWbeVd+Ewuc54B5fRkj193U3niavs+X8Xat0shnc1r7JHIBAAAAAAAAwD4Y0kNyua5mIs1+Zn0rMXVDqHFi8XYcR6aqhYnK29wMO7qq64mstw2dq2qkWbHoaJGIeRxZlmFqHStUjc38/0XkAgAAAAAAAIB/5YSWldPiJ4NvkJuJtAAwAAA=' | base64 -d | zcat > $DATABASE_FILE

# Put in test data
WORKDIR /srv/flask_api
RUN pytest
