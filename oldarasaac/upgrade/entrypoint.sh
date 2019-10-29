#!/bin/sh

set -e 

echo "Waiting for MYSQL ..."

while ! nc -z $HOST_MYSQL 3306; do
    sleep 0.1
done

echo "MySQL started"


echo "Waiting for MONGO ..."

while ! nc -z $HOST_MONGO 27017; do
    sleep 0.1
done

echo "MONGO started"

exec "$@"