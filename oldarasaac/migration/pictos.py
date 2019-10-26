# coding: utf-8

import MySQLdb
import re
import json
import logging
from pymongo import MongoClient
import pymongo
import datetime
from utils import create_logger
from functools import wraps
import time
import os
import ptvsd
from dotenv import load_dotenv


## TODO: importar también LSE_definiciones y LSE_acepciones y fotografías
# Las fotografias están en servidor arasaac, carpeta originales (junto con los pictos)
# Los ids de definiciones corresponden a los de las palabras
# Los ids de los ficheros de acepciones corresponden a la tabla de imagenes con tipo_pictograma 11
# La carpeta originales (lo que no son pictos) igual que el anterior con id_tipo_imagen=12
# Deberíamos tener entidades nuevas para lse y para las fotos.
# Estaría bien tener en nombre de la palabra asociada, no solo id por si se aprovechan...


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

def cur_a_dict(cur, include_only = []):
    '''
    devuelve lista de diccionarios
    costoso si restricción de imágenes (no plurales)
    '''
    if include_only:
        return [dict((cur.description[i][0], value) 
                    for i, value in enumerate(row)) for row in cur.fetchall()
                    if row[0] in include_only]
    else:
        return [dict((cur.description[i][0], value) 
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
        col_authors = self.mongo.users
        col_authors.create_index([('idUser', pymongo.ASCENDING)], background=True)

        sql = '''select id_autor as idUser, autor as name, empresa_institucion as company, web_autor as url, 
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
        col_authors.insert_many(data)

class Imagenes(object):
    def __init__(self, con_sql, con_mongo, lang="es"):
        '''
        consexion sql y conexion mongo
        '''
        self.con_sql = con_sql
        self.mongo = con_mongo
        self.lang = lang

    def inserta_lse(self):
        sql = '''select id_imagen
            from imagenes_12'''


    def listado_imagenes(self):
        sql_images =  '''SELECT id_imagen as idPictogram,
            fecha_creacion as created, ultima_modificacion as lastUpdated,
            id_licencia as license, id_autor as authors, 
            estado as published, synsets
            FROM imagenes where id_tipo_imagen='10'
            '''
        sql_images_es =  '''SELECT id_imagen as idPictogram,
            fecha_creacion as created, ultima_modificacion as lastUpdated,
            id_licencia as license, id_autor as authors, 
            estado as published, synsets
            FROM imagenes where id_tipo_imagen='10'
            '''
        # remove: tags_imagen as legacyTags
        if self.lang == 'es':
            sql_images = sql_images_es

        cursor = self.con_sql.cursor()

        cursor.execute(sql_images)
        
        svgs = os.getenv('FOLDER_SVGS')
        try:
            singulares = [int(f.split('.')[0]) for f in os.listdir(svgs) if f.split('.')[0].isdigit()]
            # descomentar para usar estático
            #singulares = json.load(open('singulares.json'))
        except OSError:
            logger.error('No existe carpeta de SVGs %s', svgs)
            singulares = []
        data = cur_a_dict(cursor, include_only = singulares)
        
        return data

    @timed
    def inserta_imagenes(self):
        
        data = self.listado_imagenes()

        col_authors = self.mongo.users

        # genera una colección de imagenes diferente por idioma
        
        coleccion = 'pictos_{}'.format(self.lang)
        colimages = self.mongo[coleccion]
        
        coleccion_pal = 'words_{}'.format(self.lang)
        word_col = self.mongo[coleccion_pal]

        for im in data:
            author = im['authors']  # one
            _author =  col_authors.find_one({'idUser': author})
            if _author:
                authorid = _author.get('_id')
                im['authors'] = [authorid]

            im['keywords'] = list(word_col.find({'idPictogram': im['idPictogram']},
                        projection={'_id': 0, 'idPictogram':0} ))
                         
            # tags = im.get('legacyTags')
            # if tags:
            #    im['legacyTags'] = separa_campos(im['legacyTags'])
            im['categories']=[]
            synsets = im.get('synsets')
            if synsets:
                im['synsets'] = [s.strip() for s in im['synsets'].split(';') if s]
            if im['published'] == 0:
                im['published'] = False
            else:
                im['published'] = True

            im['validated'] = False
        colimages.insert_many(data)

        # elimina colección aux de palabras
        self.mongo.drop_collection(coleccion_pal)

    def inserta_locuciones(self, palabras):
        traducciones = json.load(open('idiomas.json'))
        carpeta = ''
        for t in traducciones:
            if t.get('lang') == self.lang:
                carpeta = t.get('table')
                break
        if carpeta == 'palabras':
            carpeta = '0'
        folder = os.path.join(os.getenv('FOLDER_LOCUTIONS'), carpeta)
        try:
            locuciones_ids = [int(f.split('.')[0]) for f in os.listdir(folder)]
            for p in palabras:
                if p.get('idKeyword') in locuciones_ids:
                    p['idLocution']="{}.mp3".format(p.get('idKeyword'))
        except OSError:
            logger.error('No existe carpeta de locuciones en %s', folder) 


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
                {tablapal}.id_traduccion as idKeyword, traduccion as keyword,
                definicion_traduccion as meaning,
                id_tipo_palabra as type
                from {tablapal}, imagenes, palabra_imagen, palabras
                where imagenes.id_imagen = palabra_imagen.id_imagen and
                {tablapal}.id_palabra = palabra_imagen.id_palabra and
                palabras.id_palabra = palabra_imagen.id_palabra

                '''.format(tablapal=tablapal)
        
        sql_pal_es = '''select imagenes.id_imagen as idPictogram, 
                palabras.id_palabra as idKeyword, palabra as keyword,
                definicion as meaning, plural as plural, id_tipo_palabra as type
                from palabras, imagenes, palabra_imagen
                where imagenes.id_imagen = palabra_imagen.id_imagen and
                palabras.id_palabra = palabra_imagen.id_palabra
                ''' 
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
            else:
                del(pal['meaning'])
                
            if pal.get('keyword'):
                if charset:
                    pal['keyword'] = doble_decode(pal['keyword'], 
                                                    charset,
                                                    encoding)
                else:
                    pal['keyword'] = decode(pal['keyword'], encoding)

            if pal.get('plural'):
                if charset:
                    pal['plural'] = doble_decode(pal['plural'], 
                                                    charset,
                                                    encoding)
                else:
                    pal['plural'] = decode(pal['plural'], encoding)
            

        self.inserta_locuciones(listapals)

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
    
    # DATABASE CONNECTIONS
    load_dotenv()

    MYSQL_DATABASE = os.getenv('MYSQL_DATABASE')
    MONGO_DATABASE = os.getenv('MONGO_DATABASE')
    MYSQL_USER = os.getenv('MYSQL_USER')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
    HOST_MONGO = os.getenv('HOST_MONGO')
    HOST_MYSQL = os.getenv('HOST_MYSQL')

    client = MongoClient(host=HOST_MONGO, port=27017)
    db_mongo = getattr(client, MONGO_DATABASE)

    cnx  = MySQLdb.connect(host=HOST_MYSQL, port=3306, user = MYSQL_USER, 
                passwd = MYSQL_PASSWORD, db= MYSQL_DATABASE)

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
    logger = create_logger()
    # for debug:
    address = ('0.0.0.0', 5000)
    ptvsd.enable_attach(address)
    print("attaching")
    ptvsd.wait_for_attach()
    # esperamos si está dockerizado a que el mysql se levante
    time.sleep(5)    
    load_dotenv('.env')

    print("attached")
    breakpoint()
    print("attached2")

    # crear json con singulares (svgs) Descomentar para usar
    svgs = os.getenv('FOLDER_SVGS')
    #singulares = [int(f.split('.')[0]) for f in os.listdir(svgs)]
    singulares = [int(f.split('.')[0]) for f in os.listdir(svgs) if f.split('.')[0].isdigit()]
    json.dump(singulares, open('singulares.json', 'w'))

    genera_colecciones_palabras()
