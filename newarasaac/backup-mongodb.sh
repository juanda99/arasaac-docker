#!/bin/bash
source /data/arasaac-docker/newarasaac/.env
export CONTAINER_NAME="mongodb"
export DATABASE_NAME="arasaac"

export TIMESTAMP=$(date +'%d%m%Y_%H:%M')

docker exec -t ${CONTAINER_NAME} mongodump --archive=/data/backup/${DATABASE_NAME}-${TIMESTAMP}.archive --username ${MONGO_DB_USER} --password ${MONGO_DB_PWD} --authenticationDatabase admin --db ${DATABASE_NAME}
