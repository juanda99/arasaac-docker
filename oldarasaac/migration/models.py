# coding: utf-8

'''
Models for mongo docs.
A collection for translation

Structure:
*ids* are for integrity with legated system

{
    "_id" : ObjectId("5ab2356b111f154c17629ebf"),
    "author" : {
        "id_author" : 3,
        "first_name" : "Grupo Autonómico Elaboracion Simbolos"
    },
    "image" : "4.jpg",
    "labels" : [ 
        {
            "id_palabra" : 1825,
            "palabra" : "chupete",
            "definicion" : "m. Objeto con una parte de goma o materia similar en forma de pezón que se da a los niños para que chupen.",
            "id_colaborador" : 1,
            "ultima_modificacion" : ISODate("2006-08-15T19:01:20.000Z"),
            "estado" : 1
        }
    ],
    "tags" : [ 
        "chupete", 
        "plástico", 
        "silicona", 
        "caucho", 
        "tetina", 
        "chupar", 
        "bebé", 
        "niño", 
        "niña", 
        "azul", 
        "boca"
    ],
    "created" : ISODate("2006-07-16T18:03:22.000Z"),
    "modificated" : ISODate("2009-04-02T10:41:54.000Z"),
    "id_image" : 4
}

'''

from mongoengine import *
connect('arasaac', host='mongodb')

class Word(EmbeddedDocument):
    id_palabra = IntField()
    palabra = StringField()
    definicion = StringField()
    tipo_palabra = StringField()
    id_colaborador = IntField()
    fecha_creacion = DateTimeField()
    ultima_modificacion = DateTimeField()
    estado = IntField()

class Author(EmbeddedDocument):
    id_author = IntField()
    email = StringField(required=False)
    first_name = StringField(max_length=50)
    last_name = StringField(max_length=50)

class AraImage(Document):
    title = StringField(max_length=120)
    author = EmbeddedDocumentField(Author)
    #image = fs_ImageField(fs=fs_images, thumbnails=[60, 60], required=False)
    image = StringField(required=True)
    labels = ListField(EmbeddedDocumentField(Word))
    tags = ListField(StringField())
    synsets = ListField(StringField())
    created = DateTimeField()
    modificated = DateTimeField()
    id_image = IntField()
    image_type = StringField()
    licencia = StringField()

    meta = {
         'abstract': True
    }

class AraImage_es(AraImage):
    meta = {
        'collection': 'araimage_es'
    }

class AraImage_en(AraImage):
    meta = {
        'collection': 'araimage_en'
    }

class AraImage_ru(AraImage):
    meta = {
        'collection': 'araimage_ru'
    }

class AraImage_ro(AraImage):
    meta = {
        'collection': 'araimage_ro'
    }

class AraImage_ar(AraImage):
    meta = {
        'collection': 'araimage_ar'
    }

class AraImage_zh(AraImage):
    meta = {
        'collection': 'araimage_zh'
    }


class AraImage_bg(AraImage):
    meta = {
        'collection': 'araimage_bg'
    }


class AraImage_pl(AraImage):
    meta = {
        'collection': 'araimage_pl'
    }


class AraImage_fr(AraImage):
    meta = {
        'collection': 'araimage_fr'
    }


class AraImage_ca(AraImage):
    meta = {
        'collection': 'araimage_ca'
    }


class AraImage_eu(AraImage):
    meta = {
        'collection': 'araimage_eu'
    }


class AraImage_de(AraImage):
    meta = {
        'collection': 'araimage_de'
    }


class AraImage_it(AraImage):
    meta = {
        'collection': 'araimage_it'
    }


class AraImage_pt(AraImage):
    meta = {
        'collection': 'araimage_pt'
    }


class AraImage_ga(AraImage):
    meta = {
        'collection': 'araimage_ga'
    }


class AraImage_br(AraImage):
    meta = {
        'collection': 'araimage_br'
    }
