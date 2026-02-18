#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
until python -c "
import sys, os
import psycopg2
try:
    psycopg2.connect(
        dbname=os.environ['POSTGRES_DB'],
        user=os.environ['POSTGRES_USER'],
        password=os.environ['POSTGRES_PASSWORD'],
        host=os.environ.get('POSTGRES_HOST', 'db'),
        port=os.environ.get('POSTGRES_PORT', '5432'),
    )
    sys.exit(0)
except Exception:
    sys.exit(1)
"; do
  echo "  Postgres not ready, retrying in 1s..."
  sleep 1
done

echo "Postgres is up — running migrations..."
python manage.py migrate --noinput

echo "Starting Django server..."
exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 2 \
  --timeout 60
