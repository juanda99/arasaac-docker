// habrá que concatenar dos funciones asíncronas,
// Una para recibir los ficheros (imagenes de materiales) del dir correspondiente
// Otra que lee los datos en la bbdd
// mandar json cuandto todo acabe:
// https://stackoverflow.com/questions/2727167/how-do-you-get-a-list-of-the-names-of-all-files-present-in-a-directory-in-node-j/37532027#37532027
var Materials = require('../models/Materials')
const config = require('../../config')
var recursive = require('recursive-readdir')
var path = require('path')
var Promise = require('bluebird')

module.exports = {
  getMaterialById: (req, res) => {
    var id = req.swagger.params.idMaterial.value
    // Use lean to get a plain JS object to modify it, instead of a full model instance
    // Materials.findOne({idMaterial: id}, function(err, material){
    Materials.findOne({idMaterial: id}).lean().exec(async (err, material) => {
      if(err) {
        return res.status(500).json({
          message: 'Se ha producido un error al obtener el material',
          error: err
        })
      }
      if(!material) {
        return res.status(404).json( {
          message: 'No tenemos este material',
          err
        })
      }
      // getImages(material, ()=>(res.json(material)))
      const response =  await getImages(material)
      return res.json(response)
    })
  },
  // Materials.find({ $text: { $search: searchText, $language: locale } }, {score: {$meta: 'textScore'}}).sort({score:{$meta:'textScore'}}, function(err, materials) {
  // https://docs.mongodb.com/v3.0/reference/operator/query/text/
  searchMaterials: (req, res) => {
    var locale = req.swagger.params.locale.value
    var searchText = req.swagger.params.searchText.value
    Materials
      .find({ $text: { $search: searchText, $language: locale } }, {score: {$meta: 'textScore'}})
      .sort({'score': { '$meta': 'textScore'} })
      .lean()
      .exec (async (err, materials) => {
        if(err) {
          return res.status(500).json({
            message: 'Error buscando el material',
            error: err
          })
        }
        // if no items, return empty array
        if (materials.length===0) return res.status(404).json([]) //send http code 404!!!
        await Promise.all(
          materials.map( (material) => getImages(material)) // not async&await as we want to get all material images in parallel
        )
        console.log(materials)
        return res.json(materials)
      })
  },
  listMaterials: function(req, res) {
    Materials.find(function(err, materials){
      if(err) {
        return res.status(500).json({
          message: 'Error obteniendo los materiales',
          error: err
        })
      }
      return res.json(materials)
    })
  },
  showMaterials: function(req, res) {
    var id = req.params.id
    Materials.findOne({_id: id}, function(err, material){
      if(err) {
        return res.status(500).json({
          message: 'Se ha producido un error al obtener el material',
          error: err
        })
      }
      if(!cerveza) {
        return res.status(404).json( {
          message: 'No tenemos este material',
          err
        })
      }
      return res.json(material)
    })
  },
  createMaterials: function(req, res) {
    var material = new Materials (req.body)
    material.save(function(err, material){
      if(err) {
        return res.status(500).json( {
          message: 'Error al guardar el material',
          error: err
        })
      }
      return res.status(201).json({
        message: 'saved',
        _id: material._id
      })
    })
  },
  updateMaterials: function(req, res) {
    var id = req.params.id
    Materials.findOne({_id: id}, function(err, material){
      if(err) {
        return res.status(500).json({
          message: 'Se ha producido un error al guardar el material',
          error: err
        })
      }
      if(!material) {
        return res.status(404).json({
          message: 'No hemos encontrado el material'
        })
      }
      material.Nombre = req.body.nombre
      material.Descripción =  req.body.descripcion
      material.Graduacion = req.body.graduacion
      material.Envase = req.body.envase
      material.Precio = req.body.precio
      material.save(function(err, material){
        if(err) {
          return res.status(500).json({
            message: 'Error al guardar el material'
          })
        }
        if(!material) {
          return res.status(404).json({
            message: 'No hemos encontrado el material'
          })
        }
        return res.json(material)
      })
    })
  },
  removeMaterials: function(req, res) {
    var id = req.params.id
    Materials.findByIdAndRemove(id, function(err, material){
      if(err) {
        return res.json(500, {
          message: 'No hemos encontrado el  material',
          error: err
        })
      }
      return res.json(material)
    })
  }
}



function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
function getImages(material) {
  return new Promise ((resolve) => {
    recursive(`${config.materialsDir}/${material.idMaterial}/screenshots`, (err, files) => {
      // if err return material, if err is different from no screenshots dir, warning through console
      if (err) err.code != 'ENOENT' && console.warn (err) 
      if (files != null) {
        files.map(file =>{
          let subdir = path.dirname(file).split(path.sep).pop() //get first parent dir(material_id or language )
          let defaultLanguage = (subdir==='screenshots') 
          if (defaultLanguage) material.images.push(path.basename(file))
          // para ver la lista:
          // db.getCollection('materials').find({ translations: { $exists: true, $not: {$size: 0} } }) 
          else {
            material.translations.reduce(function(allTranslations, translation) {
              //lang because translation.language is for mongodb and ga, ca have none value!
              if (translation.lang === (subdir)) { 
                if (!translation.images) translation.images=[]
                translation.images.push(path.basename(file))
              }
              allTranslations.push(translation)
              return allTranslations
            }, [])
          }
        })
      }
      resolve(material)
    })
  })
}

