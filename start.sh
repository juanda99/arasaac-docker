#!/bin/bash
cd nginx-proxy; docker-compose up -d nginx-proxy
cd ../newarasaac; docker-compose up -d
