// habrá que concatenar dos funciones asíncronas,
// Una para recibir los ficheros (imagenes de materiales) del dir correspondiente
// Otra que lee los datos en la bbdd
// mandar json cuandto todo acabe:
// https://stackoverflow.com/questions/2727167/how-do-you-get-a-list-of-the-names-of-all-files-present-in-a-directory-in-node-j/37532027#37532027

var Materials = require('../models/Materials')
const config = require('../config')
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
      const response =  await getFiles(material)
      return res.json(response)
    })
  },
  // Materials.find({ $text: { $search: searchText, $language: locale } }, {score: {$meta: 'textScore'}}).sort({score:{$meta:'textScore'}}, function(err, materials) {
  // https://docs.mongodb.com/v3.0/reference/operator/query/text/
  // more complex search: http://stackoverflow.com/questions/28891165/using-weights-for-searching-in-mongoose
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
        const response = await Promise.all(materials.map( async material => (await getFiles(material))) // not async&await as we want to get all material images in parallel
        )
        return res.json(response)
      })
  },
  getNewMaterials: (req, res) => {
    let days = req.swagger.params.days.value
    let startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    Materials
      .find({lastUpdate: {$gt: startDate}})
      .sort({lastUpdate: -1})
      .lean()
      .exec(async(err, materials) => {
        if (err) {
          return res.status(500).json({
            message: 'Error buscando el material',
            error: err
          })
        }
        // if no items, return empty array
        if (materials.length === 0) return res.status(404).json([]) //send http code 404!!!
        const response = await Promise.all(materials.map(material => (getFiles(material))))
        return res.json(response)
      })
  },
  getLastMaterials: (req, res) => {
    const numItems = req.swagger.params.numItems.value
    Materials
      .find()
      .sort({lastUpdate: -1})
      .limit(numItems)
      .lean()
      .exec(async(err, materials) => {
        if (err) {
          return res.status(500).json({
            message: 'Error buscando el material',
            error: err
          })
        }
        // if no items, return empty array
        if (materials.length === 0) return res.status(404).json([]) //send http code 404!!!
        const response = await Promise.all(materials.map(material => (getFiles(material))))
        return res.json(response)
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

const initMaterial = material => {
  material.commonFiles=[]
  material.screenshots={}
  material.commonScreenshots=[]
  material.files={}
  material.file={}
}


const getFiles = material => {
  initMaterial(material)
  return new Promise (resolve => {
    let materialLocales=[material.lang]
    let baseDir = `${config.materialsDir}${path.sep}${material.idMaterial}${path.sep}`
    material.translations.map(translation=>materialLocales.push(translation.lang))
    recursive(baseDir, (err, files) => {
      // if err return material, if err is different from no screenshots dir, warning through console
      if (err) err.code !== 'ENOENT' && console.warn (err) 
      if (files) {
        console.log(`Files: ${files}`)
        files.map(file =>{
          let relativeFile = file.replace(baseDir, '')
          let fileName = path.basename(file)
          if (fileName === 'index.html') return // extra files from previous app
          let dir = path.dirname(relativeFile)
          let subdir = path.dirname(relativeFile).split(path.sep).pop()
          if (dir==='.'){
            //if file is tar.gz, put it inside file json  {es: xxx-es.tgz, fr: xxx.fr.tgz...}
            let filePattern = new RegExp('^index-[A-z]{2,3}-[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}.tgz$', 'i')
            if (filePattern.test(fileName)) {
              let fileLocale = fileName.split('-')[1]
              material.file[fileLocale]=fileName
            } else material.commonFiles.push(fileName)
          } else if (dir.match(/screenshots_300$/)) material.commonScreenshots.push(fileName)
          else if (dir.match(/screenshots_300\/[A-z]{2,3}$/)) {
            material.screenshots[subdir]
              ? material.screenshots[subdir].push(fileName)
              : material.screenshots[subdir] = [fileName]
          } else if (dir.match(/^[A-z]{2,3}$/)) {
            material.files[subdir]
              ? material.files[subdir].push (fileName)
              : material.files[subdir] = [fileName]
          }
        })
      }
      resolve(material)
    })
  })
}
