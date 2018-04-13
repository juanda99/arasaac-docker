#!/bin/bash
echo "Generating pictos...."
python procesar_sql_a_mongo.py
echo "Generating words.py...."
python words.py
echo "Generating materials..."
python materials.py