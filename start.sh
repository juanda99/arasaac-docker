#!/bin/bash
cd nginxproxy; docker-compose up -d nginx-proxy
cd ../newarasaac; docker-compose up -d
