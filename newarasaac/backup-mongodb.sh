#!/bin/bash
source .env
export CONTAINER_NAME="mongodb"
export DATABASE_NAME="arasaac"

export TIMESTAMP=$(date +'%Y%m%d%H%M%S')

docker exec -t ${CONTAINER_NAME} mongodump --out /data/backup/${DATABASE_NAME}-${TIMESTAMP} --username ${MONGO_DB_USER} --password ${MONGO_DB_PWD} --authenticationDatabase admin --db ${DATABASE_NAME}
