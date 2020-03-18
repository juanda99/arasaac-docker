const fs = require('fs-extra')
const Materials = require('../models/Material')
const recursive = require('recursive-readdir')
const Promise = require('bluebird')
const path = require('path')
const formidable = require('formidable')
const logger = require('../utils/logger')
const { saveFilesByType } = require('./utils')
const { MATERIAL_DIR } = require('../utils/constants')
const CustomError = require('../utils/CustomError')
const PUBLISHED = 1
// const UNPUBLISHED = 0
// const PENDING = 2

const create = (req, res) => {
  logger.debug(`EXEC create material`)
  const form = formidable({
    encoding: 'utf-8',
    keepExtensions: true,
    multiples: true,
    maxFileSize: 600 * 1024 * 1024 // 600MB instead of 200MB (default value)
  })

  form.on('error', (err) => {
    logger.error(`Error updating pictogram: ${err.message}`)
  })

  form.parse(req, async (_err, fields, files) => {
    let material
    const formData = JSON.parse(fields.formData)
    logger.debug(`Material formData: ${JSON.stringify(formData)}`)
    if (!formData.translations) {
      logger.debug(`Invalid material, need at least title and desc in one language`)
      return res.status(422).json({
        error: 'It neeeds at least title and desc in one language'
      })
    }

    /* get id for material */
    // get last file id:
    const dirs = await fs.readdir(MATERIAL_DIR)
    /* filter only *.svg files with numeric basename */
    const materialDirs = dirs
      .filter(
        dirName =>
          !isNaN(dirName)
      )
    const idMaterial = materialDirs.length ? Math.max(...materialDirs) + 1 : 1
    const data = { ...formData, idMaterial }

    const Material = new Materials(data)
    try {
      material = await Material.save()
    } catch (err) {
      console.log(err)
      return res.status(500).json({
        message: 'Error al guardar el material',
        error: err
      })
    }
    try {
      await saveFilesByType(files, material.idMaterial)
      return res.status(201).json({
        id: material.idMaterial
      })
    } catch (err) {
      logger.error(`Error creating material: ${err}`)
      return res.status(500).json({
        message: 'Error saving material',
        error: err
      })
    }
  })
}

const update = async (req, res) => {
  const { id } = req.params
  const { translations, areas, activities, status } = req.body
  const now = Date.now()

  logger.debug(
    `EXEC update for material with id ${id} and data ${JSON.stringify(req.body)}`
  )
  try {
    const material = await Materials.findOne({ idMaterial: id }).lean()
    if (!material) {
      logger.debug(`Material with id ${id} not found`)
      return res.status(404).json([])
    }
    /* we update depending on role */
    if (req.user.role !== 'admin') {
      // we just add translations if not exists:
      const languages = translations.map(translation => translation.language)
      const targetLanguages = material.translations.map(translation => translation.language)
      const found = languages.some(r => targetLanguages.indexOf(r) >= 0)
      if (found) {
        throw new CustomError(
          `A translation provided already exists in the materials and could cause conflicts`,
          403
        )
      } else {
        const addTranslations = translations.map(translation => {
          translation.lastUpdated = now
          return translation
        })
        material.translations.push([...addTranslations])
      }
    } else {
      let newTranslations
      if (areas) material.areas = areas
      if (activities) material.activities = activities
      material.status = status
      if (translations) {
        newTranslations = [...translations]
        material.translations = material.translations.map(translation => {
          /* if translation already there, we modify it */
          for (let i = 0; i < translations.length; i++) {
            if (translations[i].language === translation.language) {
              translation.title = translations[i].title
              translation.desc = translations[i].desc
              translation.lastUpdated = now
              newTranslations = newTranslations.filter(newTranslation => newTranslation.language !== translation.language)
              break
            }
          }

          /* return modify translations and not touched ones */
          return translation
        })
        /* add new translations */
        material.translations.push(...newTranslations)
      }
    }
    material.lastUpdated = now
    /* fill with files */
    await Materials.findOneAndUpdate({ idMaterial: id }, material)
    const response = await getFiles(material)
    return res.json(response)
  } catch (err) {
    logger.error(`ERROR executing update material with id ${id}`)
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err.message
    })
  }
}

const remove = (req, res) => {
  const { id } = req.params
  Materials.findByIdAndRemove(id, (err, material) => {
    if (err) {
      return res.json(500, {
        message: 'No hemos encontrado la cerveza'
      })
    }
    return res.json(material)
  })
}

const searchMaterials = (req, res) => {
  const { locale, searchText } = req.params
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

  let query
  if (req.user && req.user.role === 'admin') {
    query = { $text: { $search: searchText, $language: customLanguage } }
    logger.debug(`Exec find with searchText ${searchText} and language ${customLanguage}`)
  } else {
    query = { $text: { $search: searchText, $language: customLanguage }, status: PUBLISHED }
    logger.debug(`Exec find with searchText ${searchText}, language ${customLanguage} and status ${PUBLISHED}`)
  }

  Materials
    .find(query, { score: { $meta: 'textScore' } })
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
      if (materials.length === 0) return res.status(404).json([]) // send http code 404!!!
      const response = await Promise.all(materials.map(async material => await getFiles(material))) // not async&await as we want to get all material images in parallel
      logger.debug(`DONE: ${JSON.stringify(response)}`)
      return res.json(response)
    })
}

const getLastMaterials = (req, res) => {
  const numItems = parseInt(req.params.numItems)
  logger.debug(`EXEC getLastMaterials, total number: ${numItems}`)
  let query = { status: PUBLISHED }
  if (req.user) {
    query = {}
  }
  Materials
    .find(query)
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
      if (materials.length === 0) return res.status(404).json([]) // send http code 404!!!
      // we filter unpublished:
      let filterMaterials = materials
      if (req.user && req.user.role !== 'admin') {
        filterMaterials = materials.filter(material => material.status === PUBLISHED || material.authors.some(author => author.author._id.toString() === req.user.id))
        // we should filter translations not validated though we will validate all by default
        // filterMaterials = filterMaterials.filter(material => {
        //   material.translations = material.translations.filter(translation => translation.validated === true)
        //   return material.translations.length !== 0
        // })
      }
      const response = await Promise.all(filterMaterials.map(material => getFiles(material)))
      return res.json(response)
    })
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
    let baseDir = path.resolve(MATERIAL_DIR, material.idMaterial.toString())
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
            // if file is tar.gz, put it inside file json  {es: xxx-es.tgz, fr: xxx.fr.tgz...}
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

module.exports = {
  create,
  update,
  remove,
  getLastMaterials,
  searchMaterials
}
