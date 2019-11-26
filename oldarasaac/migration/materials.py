#!/usr/bin/env python
# -*- coding: utf-8 -*-

# previous:
# database desconocido8... see email
# materials without language: update materiales set material_idiomas='{es}' where material_idiomas=''

import pprint
import os
import pdb
import json
import codecs
import datetime
import itertools
import time
from bs4 import BeautifulSoup
import mysql.connector


def myconverter(o):
    if isinstance(o, datetime.datetime):
        return o.__str__()


def getId(str):
    """Obtenemos por ejemplo {1}{2}{3} como foreign key y devolvemos un array
    con la lista de id"""
    return '' if (str is None or str == '') else str[1:-1].split('}{')


def openReadDatabase():
    return mysql.connector.connect(user=os.environ['MYSQL_USER'], password=os.environ['MYSQL_PASSWORD'], database=os.environ['MYSQL_DATABASE'], host='db')


def obtenerMateriales():
    # cnx = openReadDatabase()
    cursor = cnx.cursor()
    query = ("SELECT * FROM materiales")
    cursor.execute(query)
    materiales = []
    columns = tuple([d[0].decode('utf8') for d in cursor.description])
    for row in cursor:
        materiales.append(dict(zip(columns, row)))
    cursor.close()
    # cnx.close()
    # pdb.set_trace()
    # Algún campo, realmente corresponde a arrays de datos:
    campos = (
        'material_autor', 'material_tipo', 'material_area_curricular', 'material_subarea_curricular', 'material_archivos',
        'material_idiomas'
    )
    # cambiamos los campos de tipo {1}{2}.. a algo como [1,2,..]
    for material in materiales:
        for campo in campos:
            material[campo] = getId(material[campo])
        # El campo descripción está guardado en html:
        soup = BeautifulSoup(material['material_descripcion'], 'html.parser')
        material['material_descripcion'] = soup.get_text().replace('\n', '\n\n')
        #print material['id_material']
        material['material_area_curricular'] = material['material_area_curricular'] if material['material_area_curricular'] else []
        material['material_subarea_curricular'] = material['material_subarea_curricular'] if material['material_subarea_curricular'] else []
        material['areas'] = material['material_area_curricular'] + material['material_subarea_curricular']

        # Borramos los datos que no nos interesan:
        del material['material_area_curricular']
        del material['material_subarea_curricular']
        del material['material_nivel']
        del material['material_objetivos']
        del material['material_dirigido']
        del material['material_edad']
        del material['material_saa']
    return materiales


def obtenerAutores():
    # cnx = openReadDatabase()
    cursor = cnx.cursor()
    query = ("SELECT id_autor, autor as name FROM autores")
    cursor.execute(query)
    autores = []
    columns = tuple([d[0].decode('utf8') for d in cursor.description])
    for row in cursor:
        autores.append(dict(zip(columns, row)))
    cursor.close()
    # cnx.close()
    return autores

def transformarMateriales():
    newMaterials=[]
    for material in materiales:
        materialDate = ''
        materialDate = str(material['fecha_alta'])
        materialDate = materialDate.replace(' ', 'T') + 'Z'
        #materialDate = 'ISODate("' + materialDate + 'Z' + '")' 
        fecha = {}
        fecha['$date']= materialDate
        #materialDate = datetime.strptime('2016-01-08T19:00:00.123Z', '%Y-%m-%dT%H:%M:%S.%fZ')
        newMaterial ={}
        # newMaterial['areas'] = [areasCurriculares[str(a)] for a in material['areas']]
        newMaterial['area'] = [areasCurriculares[str(a)] for a in material['areas']]
        newMaterial['area'] = list(itertools.chain.from_iterable(newMaterial['area']))
        newMaterial['area'] = list(set(newMaterial['area'])) # delete duplicates
        newMaterial['idMaterial'] = material['id_material']
       # newMaterial['licencia'] = licencias[material['material_licencia']]
        newMaterial['status'] = estados[material['material_estado']]
        newMaterial['activity'] = [actividades[str(a)] for a in material['material_tipo']]
        newMaterial['activity'] = list(itertools.chain.from_iterable(newMaterial['activity']))
        newMaterial['activity'] = list(set(newMaterial['activity'])) # delete duplicates
        newMaterial['title'] = material['material_titulo']
        newMaterial['created'] = fecha
        newMaterial['lastUpdated'] = fecha
        newMaterial['desc'] = material['material_descripcion']
        # newMaterial['files'] = material['material_archivos']
        # newMaterial['screenshot'] = [] 
        newMaterial['downloads'] = 0 
       # newMaterial['imagenes'] = []
       # newMaterial['recomendado'] = False
       # newMaterial['etiquetas'] = []
       # newMaterial['fechaAlta'] = material['fecha_alta']
       # newMaterial['file'] = str(material['id_material']) + ".zip"
       # newMaterial['fechaActualizacion']=None
       # MyPrettyPrinter().pprint(material['material_idiomas'][0])
        newMaterial['language'] = str(mongoLanguage[material['material_idiomas'][0]])
        newMaterial['lang'] = str(idiomas[material['material_idiomas'][0]])
        material['material_idiomas'].pop(0) # not needed for translations
        newMaterial['translations'] = []
        for language in material['material_idiomas']:
            translation={}
            translation['language'] = str(mongoLanguage[language])
            translation['lang'] = str(idiomas[language])
            translation['status'] = estados[material['material_estado']]
            translation['title'] = material['material_titulo']
            translation['desc'] = material['material_descripcion']
            translation['created'] = fecha
            translation['lastUpdated'] = fecha
            translation['downloads'] = 0
            newMaterial['translations'].append(translation)


        # newMaterial['translations']
        #print ('************************')
        #MyPrettyPrinter().pprint(material['id_material'])
        #MyPrettyPrinter().pprint(material['material_autor'])
        newMaterial['authors'] = [autor for autor in autores if autor['id_autor'] in map(int, material['material_autor'])]

        # pdb.set_trace()
        newMaterials.append(newMaterial)
    return newMaterials

class MyPrettyPrinter(pprint.PrettyPrinter):
    def format(self, object, context, maxlevels, level):
        if isinstance(object, unicode):
            return (object.encode('utf8'), True, False)
        return pprint.PrettyPrinter.format(self, object, context, maxlevels, level)

time.sleep(5)
actividades = {
    '24': [31],  # actividad lim
    '29': [1],  # actividad picaa
    '14': [2],  # animación
    '2': [3],  # aplicación informática
    '31': [4, 5],  # araboard
    '32': [6], # bingo
    '20': [7],  # canción
    '19': [8],  # cuaderno
    '1': [9],  # cuento
    '34': [11, 12, 13],  # dominos
    '15': [14],  # ficha
    '28': [15],  # jclic
    '6': [12, 13],  # juego colectivo
    '33': [12, 13, 16],  # juego de la oca
    '5': [12],  # juego individual
    '18': [17],  # libro
    '3': [14, 18, 19, 22],  # material audiovisual
    '30': [5, 20],  # pictodroid Lite
    '21': [21],  # pizarra digital
    '4': [22],  # presentación
    '12': [23],  # protocolo
    '26': [24],  # rutinas
    '25': [25],  # señaléctica
    '27': [26],  # secuencias
    '23': [27],  # smart notebook
    '16': [5],  # tablero
    '22': [28, 5],  # tablero tico
    '13': [29],  # test de evaluación
    '36': [36],  # Teacch
    '35': [35]  # Teacch
}


areasCurriculares = {
    '1': [3, 10],   # Lengua y literatura
    '2': [12, 13, 14, 15, 16],   # Matemáticas
    '4': [17, 18],   # Conocimiento del medio natural, social y cultural
    '6': [19, 20],   # Educación artística
    '7': [26],   # Conocimiento de si mismo y autonomía personal
    '8': [6],   # Taller, lo llevamos a Plástica??
    '9': [21],   # Educación física
    '10':  [22],  # Religión,
    '14': [3, 4],  # Fonética - fonología
    '13': [1, 2],  # Habilidades prelingüísticas
    '18': [3, 8, 9],  # Lectura y escritura
    '19': [19],  # Música
    '16': [5],  # Morfosintaxis
    '20': [20],  # Plástica
    '17': [3, 7],  # Pragmática
    '15': [3, 6]  # Semántica
}

estados = {
    0: 1,   # Lengua y literatura
    1: 2,   # Matemáticas
    2: 3,   #
}

idiomas = {
    'ar': 'ar', # arabe
    'bg': 'bg', # change for english
    'br': 'br', # brasileño not in mongo, change for pt
    'ca': 'ca', # change for spanish
    'de': 'de',
    'en': 'en',
    'eu': 'eu', # change for spanish
    'fr': 'fr',
    'ga': 'gl', # change for spanish
    'it': 'it',
    'pl': 'pl', 
    'pt': 'pt',
    'ro': 'ro', 
    'ru': 'ru',
    'zh': 'zh', # zht???? zhs???
    'es': 'es',
    'cr': 'hr',
    'val': 'va',
    'nl': 'nl'
}

mongoLanguage = {
    'ar': 'none', # arabe
    'bg': 'none', # change for english
    'br': 'pt', # brasileño not in mongo, change for pt
    'ca': 'none', # change for spanish
    'de': 'de',
    'en': 'en',
    'eu': 'none', # change for spanish
    'fr': 'fr',
    'ga': 'none', # change for spanish
    'it': 'it',
    'pl': 'none', 
    'pt': 'pt',
    'ro': 'ro', 
    'ru': 'ru',
    'zh': 'none', # zht????
    'es': 'es',
    'cr': 'none',
    'val': 'none',
    'nl': 'nl'
}

licencias = {
    1: 1,  # sin definir
    2: 2,  # Creative Commons BY-NC-SA
    3: 3,  # Software propietario
    4: 4,  # GNU General Public License
    5: 5 # Mozilla Public License
}


cnx = openReadDatabase()

materiales = obtenerMateriales()
autores = obtenerAutores()

cnx.close()

#MyPrettyPrinter().pprint(materiales)
#MyPrettyPrinter().pprint(autores)
#pprint.pprint(materiales)

newMaterials = transformarMateriales()
#MyPrettyPrinter().pprint(newMaterials)

# print json.dumps(MyPrettyPrinter().pprint(newMaterials))
# MyPrettyPrinter().pprint(newMaterials)
with codecs.open('data/materials.json', 'w', encoding='utf-8') as outfile:
    json.dump(newMaterials, outfile, indent=4, sort_keys=True, default = myconverter, ensure_ascii=False)
