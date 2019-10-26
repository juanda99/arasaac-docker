#!/usr/bin/env python
# -*- coding: utf-8 -*-

#import mysql.connector
import MySQLdb
import pprint
import time
import os
import magic
from bs4 import BeautifulSoup
from slugify import slugify
import pdb
import json
import codecs
import datetime
import chardet
import uuid

def decode(word, encoding):
    '''
    specific decode for lang
    '''
    try:
        return word.decode(encoding)
    except:
        logger.info ('ERROR DECODE %s  --> %s',  encoding, word.decode(encoding, 'ignore'))
        return word.decode(encoding, 'ignore')


def encode(word, encoding):
    '''
    Usa chardet para convertir a unicode
    Devuelve cadena en utf-8
    Req:
    > pip install chardet
    '''
    word2=""
    if encoding=='fixit':
        try:
            return word.decode('utf-8').encode('latin1').decode('utf-8').encode('utf-8')
        except:
            return word.decode(encoding, 'ignore')
    else:
        try: 
            tmp = word.decode(encoding)  # unicode
            return tmp.encode('utf-8')
        except:
            return word.decode(encoding, 'ignore')    
    # tmp.encode('utf-8')


def myconverter(o):
    if isinstance(o, datetime.datetime):
        return o.__str__()


def openReadDatabase():
    return MySQLdb.connect('db', os.environ['MYSQL_USER'], os.environ['MYSQL_PASSWORD'], os.environ['MYSQL_DATABASE'])

def obtenerPalabras():
    cnx = openReadDatabase()
    cursor = cnx.cursor()
    query = ("SELECT distinct(palabra) FROM palabras where palabra is not null")
    cursor.execute(query)
    palabras = []
    for row in cursor:
        palabras.append(row[0])
    cursor.close()
    cnx.close()
    return palabras

def obtenerTraducciones(table):
    cnx = openReadDatabase()
    cursor = cnx.cursor()
    query = ("SELECT distinct(traduccion) FROM " + table + " where traduccion is not null")
    cursor.execute(query)
    palabras = []
    for row in cursor:
        palabras.append(row[0])
    cursor.close()
    cnx.close()
    return palabras


class MyPrettyPrinter(pprint.PrettyPrinter):
    def format(self, object, context, maxlevels, level):
        if isinstance(object, unicode):
            return (object.encode('utf8'), True, False)
        return pprint.PrettyPrinter.format(self, object, context, maxlevels, level)

time.sleep(5)

idiomas = [{"id_idioma": 1,"idioma_ru": "Russian","idioma_abrev": "ru"},
            {"id_idioma": 2,"idioma_en": "Romanian","idioma_abrev": "ro"}, # fixit no va 
            {"id_idioma": 3,"idioma_en": "Arabic","idioma_abrev": "ar", "encoding1": "CP1256", "encoding2": "CP1256"}, 
            {"id_idioma": 4,"idioma_en": "Chinese","idioma_abrev": "zh"}, 
            {"id_idioma": 5,"idioma_en": "Bulgarian","idioma_abrev": "bg"}, 
            {"id_idioma": 6,"idioma_en": "Polish","idioma_abrev": "pl", "encoding2": "fixit"}, 
            {"id_idioma": 7,"idioma_en": "English","idioma_abrev": "en"}, # ni idea... el fixit no va :-( 
            {"id_idioma": 8,"idioma_en": "French","idioma_abrev": "fr", "encoding2": "fixit"}, 
            {"id_idioma": 9,"idioma_en": "Catalan","idioma_abrev": "ca", "encoding2": "fixit"}, 
            {"id_idioma": 10,"idioma_en": "Euskera","idioma_abrev": "eu"}, 
            {"id_idioma": 11,"idioma_en": "German","idioma_abrev": "de"}, 
            {"id_idioma": 12,"idioma_en": "Italian","idioma_abrev": "it", "encoding2": "fixit"}, 
            {"id_idioma": 13,"idioma_en": "Portuguese","idioma_abrev": "pt", "encoding2": "fixit"}, # el fixit no va 
            {"id_idioma": 14,"idioma_en": "Galician","idioma_abrev": "gl"}, 
            {"id_idioma": 15,"idioma_en": "Brazilian Portuguese","idioma_abrev": "br", "encoding2": "fixit"}, 
            {"id_idioma": 16,"idioma_en": "Croatian","idioma_abrev": "hr"}, 
            {"id_idioma": 17,"idioma_en": "Valencian","idioma_abrev": "val"},
            {"id_idioma": 18,"idioma_en": "Dutch","idioma_abrev": "nl"}
            ]

# idiomas = [{"id_idioma": 15,"idioma_en": "Brazilian Portuguese","idioma_abrev": "br", "encoding2": "fixit"}]

analisis1 = ""
myData={}
palabras = obtenerPalabras()
analisis1 = " ".join(str(x) for x in palabras) 
encoding1 = chardet.detect(analisis1).get('encoding')
if encoding1 is None:
    print "Unable to guess enconding type"
else: 
    print " Encoding expected to be: " + encoding1

for index, palabra in enumerate(palabras):
    palabras[index] = encode(palabra, 'ISO-8859-1')

myHash = uuid.uuid4().hex
myData = {'language': 'es', 'words': palabras, 'code': myHash}

jsonData = []
jsonData.append(myData)

for idioma in idiomas:
    myData = {}
    print idioma
    table = "traducciones_" + str(idioma['id_idioma'])
    palabras = obtenerTraducciones(table)
    analisis1=""
    analisis1 = " ".join(str(x) for x in palabras) 
    encoding1 = chardet.detect(analisis1).get('encoding')
    if encoding1 is None:
        print "Unable to guess enconding type"
    else: 
        print " Encoding expected to be: " + encoding1 
    if 'encoding1' in idioma:
        encoding1=idioma['encoding1']
        print "Change encoding1 to " + encoding1

    for index, palabra in enumerate(palabras):
        palabras[index] = encode(palabra, encoding1)

    myData = {'language': idioma['idioma_abrev'], 'words': palabras, 'code': myHash}

    jsonData.append(myData)

with codecs.open('data/words.json', 'w', encoding='utf-8') as outfile:
    json.dump(jsonData, outfile, indent=4, sort_keys=True, default = myconverter, ensure_ascii=False, encoding='utf8')
