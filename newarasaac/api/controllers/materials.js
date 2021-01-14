// habrá que concatenar dos funciones asíncronas,
// Una para recibir los ficheros (imagenes de materiales) del dir correspondiente
// Otra que lee los datos en la bbdd
// mandar json cuandto todo acabe:
// https://stackoverflow.com/questions/2727167/how-do-you-get-a-list-of-the-names-of-all-files-present-in-a-directory-in-node-j/37532027#37532027

const Materials = require('../models/Materials')
const config = require('../config')
const recursive = require('recursive-readdir')
const path = require('path')
const logger = require('../utils/logger')
const Promise = require('bluebird')
const PUBLISHED = 1

module.exports = {
  getMaterialById: (req, res) => {
    const id = req.swagger.params.idMaterial.value
    logger.debug(`EXEC getMaterialById with id ${id}`)
    // Use lean to get a plain JS object to modify it, instead of a full model instance
    // Materials.findOne({idMaterial: id}, function(err, material){
    Materials.findOne({ idMaterial: id, status: PUBLISHED }).populate('authors.author', 'name email company url facebook google pictureProvider').lean().exec(async (err, material) => {
      if (err) {
        logger.error(`getMaterialById with id ${id}: ${err} `)
        return res.status(500).json({
          message: `Error get MaterialById with id ${id}`,
          error: err
        })
      }
      if (!material) {
        return res.status(404).json({
          message: 'No tenemos este material',
          err
        })
      }
      // getImages(material, ()=>(res.json(material)))
      const response = await getFiles(material)
      return res.json(response)
    })
  },
  // Materials.find({ $text: { $search: searchText, $language: locale } }, {score: {$meta: 'textScore'}}).sort({score:{$meta:'textScore'}}, function(err, materials) {
  // https://docs.mongodb.com/v3.0/reference/operator/query/text/
  // more complex search: http://stackoverflow.com/questions/28891165/using-weights-for-searching-in-mongoose
  searchMaterials: (req, res) => {
    const locale = req.swagger.params.locale.value
    const searchText = req.swagger.params.searchText.value
    logger.debug(`EXEC searchMaterials with locale ${locale} and searchText ${searchText}`)
    // depending on language we can use $text index or we should set $language to none, so no stopwords 
    let customLanguage
    switch (locale) {
      case 'da':
      case 'nl':
      case 'en':
      case 'fi':
      case 'fr':
      case 'de':
      case 'hu':
      case 'it':
      case 'nb':
      case 'pt':
      case 'ro':
      case 'ru':
      case 'es':
      case 'sv':
      case 'tr':
        customLanguage = locale
        break
      case 'br':
        customLanguage = 'pt'
        break

      default:
        customLanguage = 'none'
        break
    }
    logger.debug(`Exec find with searchText ${searchText} and language ${customLanguage}`)
    Materials
      .find({ $text: { $search: searchText, $language: customLanguage }, status: PUBLISHED }, { score: { $meta: 'textScore' } })
      .sort({ 'score': { '$meta': 'textScore' } })
      .populate('authors.author', 'name email company url facebook google')
      .lean()
      .exec(async (err, materials) => {
        if (err) {
          logger.error(`searchMaterials with locale ${locale} and searchText ${searchText}: ${err} `)
          return res.status(500).json({
            message: 'Error buscando el material',
            error: err
          })
        }
        // if no items, return empty array
        if (materials.length === 0) return res.status(404).json([]) //send http code 404!!!
        const response = await Promise.all(materials.map(async material => (await getFiles(material)))) // not async&await as we want to get all material images in parallel
        logger.debug(`DONE: ${JSON.stringify(response)}`)
        return res.json(response)
      })
  },
  getNewMaterials: (req, res) => {
    let days = req.swagger.params.days.value
    let startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    logger.debug(`EXEC getNewMaterials for last ${days}, with startDate: ${startDate}`)
    Materials
      .find({ lastUpdated: { $gt: startDate } })
      .sort({ lastUpdated: -1 })
      .populate('authors.author', 'name email company url facebook google')
      .lean()
      .exec(async (err, materials) => {
        if (err) {
          return res.status(500).json({
            message: 'Error getting new materials',
            error: err
          })
        }
        // if no items, return empty array
        if (materials.length === 0) return res.status(404).json([]) //send http code 404!!!
        const response = await Promise.all(materials.map(material => (getFiles(material))))
        logger.debug(response)
        return res.json(response)
      })
  },
  getLastMaterials: (req, res) => {
    const numItems = req.swagger.params.numItems.value
    logger.debug(`EXEC getLastMaterials, total number: ${numItems}`)
    Materials
      .find()
      .sort({ lastUpdated: -1 })
      .limit(numItems)
      .populate('authors.author', 'name email company url facebook google')
      .lean()
      .exec(async (err, materials) => {
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
  removeMaterials: function (req, res) {
    var id = req.params.id
    Materials.findByIdAndRemove(id, function (err, material) {
      if (err) {
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
  material.commonFiles = []
  material.screenshots = {}
  material.commonScreenshots = []
  material.files = {}
  material.file = {}
}


const getFiles = material => {
  initMaterial(material)
  return new Promise(resolve => {
    const materialLocales = []
    let baseDir = path.resolve(config.materialsDir, material.idMaterial.toString())
    material.translations.map(translation => materialLocales.push(translation.lang))
    recursive(baseDir, (err, files) => {
      // if err return material, if err is different from no screenshots dir, warning through console
      if (err) err.code !== 'ENOENT' && console.warn(err)
      if (files) {
        files.map(file => {
          let relativeFile = file.replace(baseDir, '')
          let fileName = path.basename(file)
          if (fileName === 'index.html') return // extra files from previous app
          let dir = path.dirname(relativeFile)
          let subdir = path.dirname(relativeFile).split(path.sep).pop()
          if (dir === '.' || dir === '/') {
            //if file is tar.gz, put it inside file json  {es: xxx-es.tgz, fr: xxx.fr.tgz...}
            let filePattern = new RegExp('^index-[A-z]{2,3}-[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}.tgz$', 'i')
            if (filePattern.test(fileName)) {
              let fileLocale = fileName.split('-')[1]
              material.file[fileLocale] = fileName
            } else material.commonFiles.push(fileName)
          } else if (dir.match(/screenshots_300$/)) material.commonScreenshots.push(fileName)
          else if (dir.match(/screenshots_300\/[A-z]{2,3}$/)) {
            material.screenshots[subdir]
              ? material.screenshots[subdir].push(fileName)
              : material.screenshots[subdir] = [fileName]
          } else if (dir.match(/^[A-z]{2,3}$/)) {
            material.files[subdir]
              ? material.files[subdir].push(fileName)
              : material.files[subdir] = [fileName]
          }
        })
      }

      resolve(material)
    })
  })
}
