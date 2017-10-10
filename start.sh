#!/bin/bash
docker-compose -f nginx-proxy/docker-compose.yml up -d nginx-proxy
docker-compose -f newarasaac/docker-compose.yml up -d
