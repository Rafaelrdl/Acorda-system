#!/bin/sh
set -e

echo "Waiting for database..."
while ! python -c "
import psycopg2
import os
import dj_database_url
db = dj_database_url.parse(os.environ['DATABASE_URL'])
conn = psycopg2.connect(
    dbname=db['NAME'],
    user=db['USER'],
    password=db['PASSWORD'],
    host=db['HOST'],
    port=db['PORT'],
)
conn.close()
" 2>/dev/null; do
  echo "Database unavailable - sleeping 1s..."
  sleep 1
done
echo "Database is ready!"

echo "Applying migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting server..."
exec "$@"
