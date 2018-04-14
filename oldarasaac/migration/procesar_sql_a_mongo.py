# coding: utf-8

import MySQLdb
import re
import json
import models
import logging
from mongoengine import DoesNotExist
import os

import logging

logger = logging.getLogger('Arasaac DATA')
logger.setLevel(logging.DEBUG)
# create file handler which logs even debug messages
fh = logging.FileHandler('arasaac_data.log')
fh.setLevel(logging.DEBUG)
# create console handler with a higher log level
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
# create formatter and add it to the handlers
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)
ch.setFormatter(formatter)
# add the handlers to the logger
logger.addHandler(fh)
logger.addHandler(ch)

# útiles
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

def insertar_imagenes(lang='es'):
    '''
    Extract Mysql info: image & author
    '''
    sql_images =  '''SELECT imagen as image, id_imagen as id_image,
        fecha_creacion as created, ultima_modificacion as modificated
        FROM imagenes'''
    sql_images_autor =  '''SELECT imagen as image, id_imagen as id_image,
        fecha_creacion as created, ultima_modificacion as modificated,
        autores.id_autor as id_author, autor as first_name, email_autor as email
        FROM autores, imagenes
        WHERE imagenes.id_autor = autores.id_autor'''

    cursor.execute(sql_images_autor)

    # genera una colección diferente por idioma
    Image = getattr(models, 'AraImage_' + lang)
    
    for im in cur_a_dict(cursor):
        autor = models.Author(id_author = im.pop('id_author'), first_name = im.pop('first_name').decode('latin1'), 
            email=im.pop('email'))
        _im = Image(**im)
        _im.author = autor
        _im.save()
    
def decode(word, encoding):
    '''
    specific decode for lang
    '''
    try:
        return word.decode(encoding)
    except:
        logger.info ('ERROR DECODE %s %s',  word, encoding)
        return word.decode(encoding, 'ignore')

def insertar_palabras(lang='es'):
    traducciones = json.load(open('idiomas.json'))
    if lang=='es':
        tablapal = 'palabras'
        encoding = 'latin1'
    else:
        for t in traducciones:
            if t['lang'] ==lang:
                tablapal = 'traducciones_{}'.format(t['table'])
                encoding = t['encoding']
                break

    # Coleccion por idioma
    Image = getattr(models, 'AraImage_' + lang)

    sql_pal = '''select imagenes.id_imagen as id_image, {tablapal}.id_palabra, traduccion as palabra,
            definicion_traduccion as definicion, {tablapal}.id_colaborador, 
            fecha_alta as fecha_creacion, fecha_modificacion as ultima_modificacion, {tablapal}.estado 
            from {tablapal}, imagenes, palabra_imagen
            where imagenes.id_imagen = palabra_imagen.id_imagen and
            {tablapal}.id_palabra = palabra_imagen.id_palabra
            '''.format(tablapal=tablapal, lang=lang)
    
    sql_pal_es = '''select imagenes.id_imagen as id_image, palabras.id_palabra, palabra,
            definicion, palabras.id_colaborador, 
            palabras.fecha_creacion, palabras.ultima_modificacion, palabras.estado,
            imagenes.tags_imagen as tags
            from palabras, imagenes, palabra_imagen
            where imagenes.id_imagen = palabra_imagen.id_imagen and
            palabras.id_palabra = palabra_imagen.id_palabra
            '''
    if lang == 'es':
        sql_pal = sql_pal_es

    cursor.execute(sql_pal)
    listapals = cur_a_dict(cursor)
    for pal in listapals:
        if pal['definicion']:
            pal['definicion'] = decode(pal['definicion'], encoding)
        if pal['palabra']:
            pal['palabra'] = decode(pal['palabra'], encoding)
            i = Image.objects.get(id_image = pal.pop('id_image'))
            # tags? solo en español y asociados a imagen, no a palabra en legated
            if 'tags'in pal:
                tags = pal.pop('tags')
                if tags and not i.tags:
                    i.tags = separa_campos(tags)
            i.labels.append(models.Word(**pal))
            i.save()

if __name__ == '__main__':
    # MYSQL connection
    cnx  = MySQLdb.connect(user=os.environ['MYSQL_USER'], passwd=os.environ['MYSQL_PASSWORD'], db=os.environ['MYSQL_DATABASE'], host='db')
    cursor = cnx.cursor()
    # configurar para group_concat
    #cursor.execute("SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));")

    import json
    idiomas = json.load(open('idiomas.json'))
    langs = [d.get('lang') for d in idiomas]
    for l in langs:
        logger.info('Procesando imagenes --> %s', l)
        insertar_imagenes(l)
        logger.info('Procesando palabras --> %s', l)
        insertar_palabras(l)
    
        



