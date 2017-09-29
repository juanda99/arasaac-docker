#!/bin/bash
docker-compose -f nginx-proxy/docker-compose.yml run -d nginx-proxy
docker-compose -f newarasaac/docker-compose.yml up -d
