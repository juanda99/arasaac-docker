# coding: utf-8

import MySQLdb
import re
import json
from pymongo import MongoClient
from bson.objectid import ObjectId
from bson.json_util import dumps
import datetime
import time
import os
import logging

from dotenv import load_dotenv


# TODO: importar también LSE_definiciones y LSE_acepciones y fotografías
# Las fotografias están en servidor arasaac, carpeta originales (junto con los pictos)
# Los ids de definiciones corresponden a los de las palabras
# Los ids de los ficheros de acepciones corresponden a la tabla de imagenes con tipo_pictograma 11
# La carpeta originales (lo que no son pictos) igual que el anterior con id_tipo_imagen=12
# Deberíamos tener entidades nuevas para lse y para las fotos.
# Estaría bien tener en nombre de la palabra asociada, no solo id por si se aprovechan...


# útiles

# from pathlib import Path  # python3 only
# env_path = Path('.') / '.env'
# print(open(env_path).read())
# load_dotenv(dotenv_path=env_path)

MYSQL_DATABASE = os.getenv('MYSQL_DATABASE')
MONGO_DATABASE = os.getenv('MONGO_DATABASE')
MYSQL_USER = os.getenv('MYSQL_USER')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
HOST_MONGO = os.getenv('HOST_MONGO')
HOST_MYSQL = os.getenv('HOST_MYSQL')

client = MongoClient(host=HOST_MONGO, port=27017)

cnx = MySQLdb.connect(host=HOST_MYSQL, port=3306, user=MYSQL_USER,
                      passwd=MYSQL_PASSWORD, db=MYSQL_DATABASE)

cursor = cnx.cursor()

sql = '''SELECT id_palabra, imagenes.id_imagen FROM palabra_imagen, imagenes where id_tipo_imagen=11 and imagenes.id_imagen=palabra_imagen.id_imagen order by id_palabra'''

cursor.execute(sql)
dict_kw = dict(cursor.fetchall())

arasaac_db = client.arasaac
col_pictos = arasaac_db.pictos_es

cambios = []
logging.basicConfig(format='%(levelname)s:%(message)s', level=logging.INFO)
logging.info('Iniciando inserción de LSE')
for i in col_pictos.find():
    for k in i.get('keywords'):
        idKeyword = k.get('idKeyword')
        lse = dict_kw.get(int(idKeyword))
        if lse:
            i["idLSE"] = lse
            col_pictos.update_many({'keywords.idKeyword': idKeyword},
                                   {"$set": {'keywords.$.idLSE': lse}})
    cambios.append(i)
logging.info('FIN inserción de LSE')
open('images_es.json', 'w').write(dumps(cambios))
