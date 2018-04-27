# coding: utf-8

import MySQLdb
import re
import os
import json
import logging
from pymongo import MongoClient
import pymongo
import datetime
from utils import create_logger
from functools import wraps
import time

# wait until mysql is ready
time.sleep(5)


# DATABASE CONNECTIONS
client = MongoClient(host='mongodb', port=27017)
db_mongo = client['arasaac']
cnx  = MySQLdb.connect(user=os.environ['MYSQL_USER'], passwd=os.environ['MYSQL_PASSWORD'], db=os.environ['MYSQL_DATABASE'], host='db')

logger = create_logger()


# útiles
def timed(func):
    """This decorator prints the execution time for the decorated function."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        logger.info("TIEMPO: %s ", round(end - start, 2))
        return result
    return wrapper

def cur_a_dict(cur):
    '''
    devuelve lista de diccionarios
    '''
    return [dict((cur.description[i][0], value) \
               for i, value in enumerate(row)) for row in cur.fetchall()]

def limpia(s):
    '''
    limpia caracteres de cadenas
    '''
    return re.findall(r'[^!,.?":;]+', s)[0]

def separa_campos(texto):
    '''Devuelve lista de tags. Están separados por {} en la bd
    '''
    try:
        _texto = texto.decode('utf-8')
    except:
        _texto = texto.encode('latin1').decode('utf-8')
    try:
        return [limpia(c.strip()) for c in re.findall('{(.*?)}', _texto) if c.strip()]
    except:
        logger.info('ERROR EXTRACCION TAGS: %s', texto)
        return []

def decode(word, encoding):
    '''
    specific decode for lang
    '''
    try:
        return word.decode(encoding)
    except:
        logger.info ('ERROR DECODE %s  --> %s',  encoding, word.decode(encoding, 'ignore'))
        return word.decode(encoding, 'ignore')

def doble_decode(word, deco, enco):
    '''
    Corrige encoding
    '''
    if deco == 'utf8':
        deco = 'utf-8'
    try:
        return word.decode(deco).encode(enco)
    except:
        logger.info ('ERROR DECODE %s  --> %s',  deco, word.decode(deco, 'ignore'))
        return word.decode(deco, 'ignore')


class Autores(object):
    def __init__(self, con_sql, con_mongo):
        '''
        consexion sql y conexion mongo
        '''
        self.cursor = con_sql.cursor()
        self.mongo = con_mongo
        
    def procesar(self):
        col_authors = self.mongo.authors
        col_authors.create_index([('idAuthor', pymongo.ASCENDING)], background=True)

        sql = '''select id_autor as idAuthor, autor as name, empresa_institucion as company, web_autor as url, 
                email_autor as email from autores
                '''
        self.cursor.execute(sql)
        data = cur_a_dict(self.cursor)
        for d in data:
            if d.get('url') == 'http://':
                del d['url']
            company = d.get('company')
            if company:
                d['company'] = company.decode('latin1').encode('utf-8')
            name = d.get('name')
            if name:
                d['name'] = name.decode('latin1').encode('utf-8')

        logger.info('Insertando autores')
        col_authors.drop()
        col_authors.insert_many(data)

class Imagenes(object):
    def __init__(self, con_sql, con_mongo, lang="es"):
        '''
        consexion sql y conexion mongo
        '''
        self.con_sql = con_sql
        self.mongo = con_mongo
        self.lang = lang
        
        
    def inserta_locuciones(self):
        '''
        Locuciones sólo en español?
        '''
        pass

    def inserta_lse(self):
        sql = '''select id_imagen
            from imagenes_12'''

    @timed
    def inserta_imagenes(self):
        '''
        Extract Mysql info: image & author
        Usa infor de auxiliar de palabras word_
        '''
        sql_images =  '''SELECT id_imagen as idPictogram,
            fecha_creacion as created, ultima_modificacion as lastUpdate,
            licencia as license, id_autor as authors,
            estado as status 
            FROM imagenes_10, licencias
            WHERE imagenes_10.id_licencia = licencias.id_licencia'''
            
        sql_images_autor =  '''SELECT imagen as image, id_imagen as id_image,
            fecha_creacion as created, ultima_modificacion as modificated,
            autores.id_autor as id_author, autor as first_name, email_autor as email
            FROM autores, imagenes
            WHERE imagenes.id_autor = autores.id_autor'''

        cursor = self.con_sql.cursor()

        cursor.execute(sql_images)
        data = cur_a_dict(cursor)

        col_authors = self.mongo.authors

        # genera una co# imagenes.tags_imagen as tags  PENDIENTE TAGS      lección diferente por idioma
        coleccion = 'pictos_{}'.format(self.lang)
        colimages = self.mongo[coleccion]
        
        coleccion_pal = 'words_{}'.format(self.lang)
        word_col = self.mongo[coleccion_pal]

        for im in data:
            if im['status'] == 1:
                im['status'] = 'publish'
            author = im['authors']  # one
            _author =  col_authors.find_one({'idAuthor': author})
            if _author:
                authorid = _author.get('_id')
                im['authors'] = [authorid]

            im['keywords'] = list(word_col.find({'idPictogram': im['idPictogram']}))
            # eliminar _id de cada keyword?
        # drop collections from previous import
        colimages.drop()
        colimages.insert_many(data)

        # elimina colección aux de palabras
        self.mongo.drop_collection(coleccion_pal)
        
    def listado_palabras(self):
        '''
        Devuelve listado de palabras preparadas para insertar en mongo
        '''
        lang = self.lang

        traducciones = json.load(open('idiomas.json'))
        idioma = ''
        charset = ''  # cursor charset
        if lang=='es':
            tablapal = 'palabras'
            encoding = 'latin1'
        else:
            for t in traducciones:
                if t['lang'] == lang:
                    tablapal = 'traducciones_{}'.format(t['table']) #!! Tablas de traducciones ?
                    encoding = t['encoding']
                    idioma = t['table']
                    charset = t.get('charset', '')
                    break

        sql_pal = '''select imagenes.id_imagen as idPictogram, 
                {tablapal}.id_palabra as idKeyword, traduccion as keyword,
                definicion_traduccion as meaning,
                tipo_palabra_en as type
                from {tablapal}, imagenes, palabra_imagen, tipos_palabra, palabras
                where imagenes.id_imagen = palabra_imagen.id_imagen and
                {tablapal}.id_palabra = palabra_imagen.id_palabra and
                palabras.id_tipo_palabra = tipos_palabra.id_tipo_palabra and
                palabras.id_palabra = palabra_imagen.id_palabra

                '''.format(tablapal=tablapal)
        
        sql_pal_es = '''select imagenes.id_imagen as idPictogram, 
                palabras.id_palabra as idKeyword, palabra as keyword,
                definicion as meaning,
                tipo_palabra_{} as type
                from palabras, imagenes, palabra_imagen, tipos_palabra
                where imagenes.id_imagen = palabra_imagen.id_imagen and
                palabras.id_palabra = palabra_imagen.id_palabra and
                palabras.id_tipo_palabra = tipos_palabra.id_tipo_palabra
                '''.format(lang)
        # imagenes.tags_imagen as tags  PENDIENTE TAGS      

        if lang == 'es':
            sql_pal = sql_pal_es  # la estructura para español es diferente

        cursor = self.con_sql.cursor()
        if charset:
            logger.info ('Cambio de charset a %s', charset)
            cursor.execute('SET CHARACTER SET {};'.format(charset))
            # cursor.execute('SET character_set_connection={};'.format(charset))
            
        cursor.execute(sql_pal)

        listapals = cur_a_dict(cursor)
        logger.info ('TOTAL: %s palabras', len(listapals))
        
        for pal in listapals:
            if pal.get('meaning'):
                if charset:
                    pal['meaning'] = doble_decode(pal['meaning'], 
                                                    charset,
                                                    encoding)
                else:
                    pal['meaning'] = decode(pal['meaning'], encoding)
            if pal.get('keyword'):
                if charset:
                    pal['keyword'] = doble_decode(pal['keyword'], 
                                                    charset,
                                                    encoding)
                else:
                    pal['keyword'] = decode(pal['keyword'], encoding)
                
        return listapals

    @timed
    def inserta_palabras(self):
        '''
        Inserta todas las palabras en una colección específica por idioma
        siguiendo la estructura del json planteado.
        '''
        coleccion = 'words_{}'.format(self.lang)
        word_col = self.mongo[coleccion]
        word_col.create_index([('idPictogram', pymongo.ASCENDING)], background=True)
        word_col.drop()
        word_col.insert_many(self.listado_palabras())

    def procesar(self):
        self.inserta_palabras()
        self.inserta_imagenes()


def genera_colecciones_palabras():
    '''Genera las colecciones de palabras/pictogramas
    Crea colección auxiliar de palabra
    Genera colección de pictos específica por idioma:
    * Embebe lista de palabras
    * Referencia a autor

    Usa idiomas.json como configuración
    '''


    a = Autores(cnx, db_mongo)
    a.procesar()
    
    idiomas = json.load(open('idiomas.json'))
    langs = [d.get('lang') for d in idiomas]
    for l in langs:
        logger.info('Procesando palabras --> %s', l)
        im = Imagenes(cnx, db_mongo, l)
        im.inserta_palabras()
        logger.info('Procesando imagenes --> %s', l)
        im.inserta_imagenes() 

if __name__ == '__main__':
    genera_colecciones_palabras()
