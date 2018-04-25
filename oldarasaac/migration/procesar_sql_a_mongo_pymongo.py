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

def limpia(s):
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

def cur_a_dict(cur):
    '''
    devuelve lista de diccionarios
    '''
    return [dict((cur.description[i][0], value) \
               for i, value in enumerate(row)) for row in cur.fetchall()]


def inserta_locuciones():
    '''
    Locuciones sólo en español?
    '''
    pass

def inserta_lse():
    sql = '''select id_imagen
        from imagenes_12'''


@timed
def insertar_imagenes(lang='es'):
    '''
    Extract Mysql info: image & author
    '''
    global cursor

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

    cursor.execute(sql_images)
    data = cur_a_dict(cursor)

    # genera una colección diferente por idioma
    coleccion = 'araimage_{}'.format(lang)
    colimages = db_mongo[coleccion]
    
    coleccion_pal = 'words_{}'.format(lang)
    word_col = db_mongo[coleccion_pal]

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

    colimages.insert_many(data)
    
def decode(word, encoding):
    '''
    specific decode for lang
    '''
    try:
        return word.decode(encoding)
    except:
        logger.info ('ERROR DECODE %s  --> %s',  encoding, word.decode(encoding, 'ignore'))
        return word.decode(encoding, 'ignore')

def listado_palabras(lang='es'):
    traducciones = json.load(open('idiomas.json'))
    idioma = ''
    if lang=='es':
        tablapal = 'palabras'
        encoding = 'latin1'
    else:
        for t in traducciones:
            if t['lang'] ==lang:
                tablapal = 'traducciones' # _{}'.format(t['table']) !! Tablas de traducciones ?
                encoding = t['encoding']
                idioma = t['table']
                break

    sql_pal = '''select imagenes.id_imagen as idPictogram, 
            {tablapal}.id_palabra as idKeyword, traduccion as keyword,
            definicion_traduccion as meaning,
            tipo_palabra_en as type
            from {tablapal}, imagenes, palabra_imagen, tipos_palabra, palabras
            where traducciones.id_idioma = {idioma} and
            imagenes.id_imagen = palabra_imagen.id_imagen and
            {tablapal}.id_palabra = palabra_imagen.id_palabra and
            palabras.id_tipo_palabra = tipos_palabra.id_tipo_palabra and
            palabras.id_palabra = palabra_imagen.id_palabra

            '''.format(tablapal=tablapal, lang=lang, idioma=idioma)

       
    # imagenes.tags_imagen as tags  PENDIENTE TAGS
    
    sql_pal_es = '''select imagenes.id_imagen as idPictogram, 
            palabras.id_palabra as idKeyword, palabra as keyword,
            definicion as meaning,
            tipo_palabra_{} as type
            from palabras, imagenes, palabra_imagen, tipos_palabra
            where imagenes.id_imagen = palabra_imagen.id_imagen and
            palabras.id_palabra = palabra_imagen.id_palabra and
            palabras.id_tipo_palabra = tipos_palabra.id_tipo_palabra
            '''.format(lang)

    if lang == 'es':
        sql_pal = sql_pal_es

    cursor.execute(sql_pal)

    listapals = cur_a_dict(cursor)

    logger.info ('TOTAL: %s palabras', len(listapals))
    
    for pal in listapals:
        if pal.get('meaning'):
            pal['meaning'] = decode(pal['meaning'], encoding)
        if pal.get('keyword'):
            pal['keyword'] = decode(pal['keyword'], encoding)
            
    return listapals

@timed
def inserta_palabras(lang='es'):
    '''
    Inserta todas las palabras en una colección específica por idioma
    siguiendo la estructura del json planteado.
    '''
    coleccion = 'words_{}'.format(lang)
    word_col = db_mongo[coleccion]
    word_col.create_index([('idPictogram', pymongo.ASCENDING)], background=True)
    word_col.insert_many(listado_palabras(lang))

def genera_colecciones_palabras():
    '''Genera las colecciones de palabras/pictogramas
    Crea colección auxiliar de palabra
    Genera colección de pictos específica por idioma:
    * Embebe lista de palabras
    * Referencia a autor

    Usa idiomas.json como configuración
    '''
    import json
    idiomas = json.load(open('idiomas.json'))
    langs = [d.get('lang') for d in idiomas]
    for l in langs:
        logger.info('Procesando palabras --> %s', l)
        inserta_palabras(l)
        logger.info('Procesando imagenes --> %s', l)
        insertar_imagenes(l) 

def autores():
    global col_authors
    sql = '''select id_autor as idAuthor, autor as name, empresa_institucion as company, web_autor as url, 
            email_autor as email from autores
            '''
    cursor.execute(sql)
    data = cur_a_dict(cursor)
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
    result = col_authors.insert_many(data)
    return result   
    
if __name__ == '__main__':
    # MYSQL connection
    # CONFIGURACION
    DBSQL = 'arasaac'
    DBMONGO = 'arasaacx'

    client = MongoClient(host='mongodb', port=27017)
    db_mongo = client.DBMONGO
    cnx  = MySQLdb.connect(user=os.environ['MYSQL_USER'], passwd=os.environ['MYSQL_PASSWORD'], db=os.environ['MYSQL_DATABASE'], host='db')
    cursor = cnx.cursor()

    ''' 
    Colección general del mongo para los autores.
    En las imágenes irá como referencia
    '''
    col_authors = db_mongo.authors
    col_authors.create_index([('idAuthor', pymongo.ASCENDING)], background=True)

    # configurar para group_concat
    #cursor.execute("SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));")
    
    import json
    # fichero de configuración de idomas - encodings
    idiomas = json.load(open('idiomas.json'))
    langs = [d.get('lang') for d in idiomas]

    # función para generar palabras e imagenes
    genera_colecciones_palabras()
    

    
    
        



