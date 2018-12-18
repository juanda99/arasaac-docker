#!/bin/bash
echo "***********START MIGRATION***************"
echo "Generating pictos...."
python procesar_sql_a_mongo_pymongo.py
#echo "Generating words.py...."
python words.py
#echo "Generating materials..."
python materials.py
