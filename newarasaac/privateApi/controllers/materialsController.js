const fs = require('fs-extra')
const Materials = require('../models/Material')
const Users = require('../models/User')
const { ObjectID } = require('mongodb')
const recursive = require('recursive-readdir')
const Promise = require('bluebird')
const path = require('path')
const formidable = require('formidable')
const logger = require('../utils/logger')
const { saveFilesByType } = require('./utils')
const { MATERIAL_DIR } = require('../utils/constants')
const CustomError = require('../utils/CustomError')
const _ = require('lodash')
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
    logger.error(`Error creating material: ${err.message}`)
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
      const saveMaterialFiles = saveFilesByType(files, material.idMaterial)
      // create a dir per language if not exists, just for languages without specific languagefiles */
      const promisesLanguageDir = material.translations
        .map(translation => translation.lang)
        .map(language => fs.ensureDir(path.resolve(MATERIAL_DIR, idMaterial.toString(), language)))
      await Promise.all([saveMaterialFiles, promisesLanguageDir])
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

const addTranslation = (req, res) => {
  const { idMaterial } = req.params
  logger.debug(`EXEC addTranslation`)
  const form = formidable({
    encoding: 'utf-8',
    keepExtensions: true,
    multiples: true,
    maxFileSize: 600 * 1024 * 1024 // 600MB instead of 200MB (default value)
  })

  form.on('error', (err) => {
    logger.error(`Error addTranslation: ${err.message}`)
  })

  form.parse(req, async (_err, fields, files) => {
    const formData = JSON.parse(fields.formData)
    logger.debug(`Material formData: ${JSON.stringify(formData)}`)
    if (!formData.translations) {
      logger.debug(`Invalid material, need at least one translation`)
      return res.status(422).json({
        error: 'It neeeds at least one translation'
      })
    }

    try {
      const material = await Materials.findOne({ idMaterial }).lean()
      if (!material) {
        throw new CustomError(
          `Material with id ${idMaterial} not found`,
          500
        )
      }

      /* chek that the language does not exists */
      /* first language is the one that matters */
      const targetLanguage = formData.translations[0]
      const existsLanguage = material.translations.some(translation => translation.language === targetLanguage)
      if (existsLanguage) {
        throw new CustomError(
          `Translation provided already exists in the material and could cause conflicts`,
          403
        )
      }
      material.translations.push(targetLanguage)
      material.lastUpdated = Date.now()
      await Materials.findOneAndUpdate({ idMaterial }, material)
      await saveFilesByType(files, idMaterial)
      return res.status(201).json({
        id: idMaterial
      })
    } catch (err) {
      logger.error(`Error adding translation to material: ${err.message}`)
      return res.status(err.httpCode || 500).json({
        message: `Error adding translation to material ${idMaterial}`,
        error: err.message
      })
    }
  })
}

const update = async (req, res) => {
  const { id } = req.params
  const { translations, areas, activities, status, authors } = req.body
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
      const languages = translations.map(translation => translation.lang)
      const targetLanguages = material.translations.map(translation => translation.lang)
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
      if (authors) material.authors = authors
      if (status !== undefined && status !== null) material.status = status
      if (translations) {
        newTranslations = [...translations]
        material.translations = newTranslations
        // material.translations = material.translations.map(translation => {
        /* if translation already there, we modify it */
        //   for (let i = 0; i < translations.length; i++) {
        //     if (translations[i].lang === translation.lang) {
        //       translation.title = translations[i].title
        //       translation.desc = translations[i].desc
        //       translation.authors = translations[i].authors
        //       translation.lastUpdated = now
        //       newTranslations = newTranslations.filter(newTranslation => newTranslation.lang !== translation.lang)
        //       break
        //     }
        //   }

        //   /* return modify translations and not touched ones */
        //   return translation
        // })
        // /* add new translations */
        // material.translations.push(...newTranslations)
      }
    }
    material.lastUpdated = now
    /* fill with files */
    const modifyMaterial = await Materials
      .findOneAndUpdate({ idMaterial: id }, material, { new: true })
      .populate('authors.author', 'name email company url facebook google pictureProvider')
      .populate('translations.authors.author', 'name email company url facebook google pictureProvider')
      .lean()

    const response = await getFiles(modifyMaterial)
    return res.json(response)
  } catch (err) {
    logger.error(`ERROR executing update material with id ${id}`)
    return res.status(err.httpCode || 500).json({
      message: 'Error updating material. See error field for detail',
      error: err.message
    })
  }
}

const getMaterialById = (req, res) => {
  const { id } = req.params
  logger.debug(`EXEC getMaterialById with id ${id}`)
  // Use lean to get a plain JS object to modify it, instead of a full model instance
  // Materials.findOne({idMaterial: id}, function(err, material){
  Materials
    .findOne({ idMaterial: id })
    .populate('authors.author', 'name email company url facebook google pictureProvider')
    .populate('translations.authors.author', 'name email company url facebook google pictureProvider')
    .lean().exec(async (err, material) => {
      if (err) {
        logger.error(`getMaterialById with id ${id}: ${err} `)
        return res.status(500).json({
          message: `Error get MaterialById with id ${id}`,
          error: err
        })
      }
      if (!material) {
        return res.status(404).json({
          message: 'Material not found',
          err
        })
      }
      /* check by user */
      if (material.status !== PUBLISHED) {
        if (!req.user) return res.status(403).json({ message: 'Material not published, access forbidden', err })
        else if (req.user.role !== 'admin') {
          /* if no author, it's not showned */
          let languageAuthors = material.translations.map(translation => translation.authors)
          languageAuthors = _.flatten(languageAuthors)
          const authors = [...languageAuthors, ...material.authors]
          const authorExists = authors.some(author => author.author._id.toString() === req.user.id)
          if (!authorExists) return res.status(403).json({ message: 'Material not published, access forbidden', err })
        }
      }
      const response = await getFiles(material)
      return res.json(response)
    })
}

const remove = async (req, res) => {
  const { id } = req.params
  logger.debug(`EXEC remove material with id ${id}`)
  try {
    const material = await Materials.deleteOne({ 'idMaterial': id })
    if (!material.n) throw new CustomError(`Remove material with id: ${id} not found`, 404)
    /* now we remove from file system */
    await fs.remove(`${MATERIAL_DIR}/${id}`)
    return res.json({ idMaterial: id })
  } catch (err) {
    logger.error(`Error remove material with id ${id}: ${err.message}`)
    return res.status(err.httpCode || 500).json({
      message: `Error remove material with id ${id}`,
      error: err.message
    })
  }
}



const addFavoriteList = async (req, res) => {
  const { listName } = req.params
  const { id } = req.user
  const now = Date.now()
  logger.debug(`EXEC addFavoriteList for user ${id} and listName ${listName} `)
  try {
    const user = await User.findById(id)
    if (!user) {
      throw new CustomError(USER_NOT_EXISTS, 404)
    }
    if (!user.favorites) user.favorites = { defaultList: [], listName: [] }
    else user.favorites[listName] = []
    user.markModified('favorites')
    user.updated = now
    await user.save()
    logger.debug(`DONE addFavoriteList for user ${id} and listName ${listName} `)
    return res.status(204).json()
  } catch (err) {
    logger.error(
      `ERROR addFavoriteList for user ${id} and listName ${listName}: ${err} `
    )
    return res.status(err.httpCode || 500).json({
      message: 'Error updating favorites.   See error field for detail',
      error: err
    })
  }
}

const searchMaterials = async (req, res) => {
  const { locale, searchText, searchType } = req.params
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
  /* we can search by content, author or type of material */

  if (searchType === 'activity') {
    if (req.user && req.user.role === 'admin') {
      query = { activities: searchText }
      logger.debug(`Exec find with activity ${searchText}`)
    } else {
      query = { activities: searchText, status: PUBLISHED }
      logger.debug(`Exec find with activity ${searchText}and status ${PUBLISHED}`)
    }
  }
  else if (searchType === 'area') {
    if (req.user && req.user.role === 'admin') {
      query = { areas: searchText }
      logger.debug(`Exec find with area ${searchText}`)
    } else {
      query = { areas: searchText, status: PUBLISHED }
      logger.debug(`Exec find with area ${searchText} and status ${PUBLISHED}`)
    }
  }

  else if (searchType === 'author') {
    try {
      const users = await Users.find({ name: searchText }).lean()
      if (!users.length) {
        logger.debug(
          `Not found user with name ${searchText} `
        )
        return res.status(404).json([])
      }
      if (req.user && req.user.role === 'admin') {
        query = { $or: [{ "authors.author": { $in: users.map(user => ObjectID(user._id)) } }, { "translations.authors.author": { $in: users.map(user => ObjectID(user._id)) } }] }
        logger.debug(`Exec find with searchText ${searchText} and language ${customLanguage} `)
      } else {
        query = { $or: [{ "authors.author": { $in: users.map(user => ObjectID(user._id)) } }, { "translations.authors.author": { $in: users.map(user => ObjectID(user._id)) } }], status: PUBLISHED }
        logger.debug(`Exec find with searchText ${searchText}, language ${customLanguage} and status ${PUBLISHED} `)
      }

    } catch (err) {
      logger.error(
        `ERROR Getting materials for searchType ${searchType} and searchText ${searchText}: ${err} `
      )
      return res.status(err.httpCode || 500).json({
        message: 'Error getting materials. See error field for detail',
        error: err
      })
    }
  }
  else {
    if (req.user && req.user.role === 'admin') {
      query = { $text: { $search: searchText, $language: customLanguage } }
      logger.debug(`Exec find with searchText ${searchText} and language ${customLanguage} `)
    } else {
      query = { $text: { $search: searchText, $language: customLanguage }, status: PUBLISHED }
      logger.debug(`Exec find with searchText ${searchText}, language ${customLanguage} and status ${PUBLISHED} `)
    }
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
      logger.debug(`DONE: Materials sended `)
      return res.json(response)
    })
}

const getLastMaterials = (req, res) => {
  const numItems = parseInt(req.params.numItems)
  logger.debug(`EXEC getLastMaterials, total number: ${numItems} `)
  let query = { status: PUBLISHED }
  // if (req.user) {
  //   query = {}
  // }
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

const getUnpublished = async (req, res) => {
  logger.debug(`EXEC getUnpublished materials`)
  let query = { status: { $ne: PUBLISHED } }

  try {
    const materials = await Materials
      .find(query)
      .sort({ lastUpdated: -1 })
      .populate('authors.author', 'name email company url facebook google')
      .lean()
    // if no items, return empty array
    if (materials.length === 0) return res.status(200).json([]) // send http code 404!!!
    // we also get files:
    const response = await Promise.all(materials.map(material => getFiles(material)))
    return res.json(response)
  } catch (err) {
    logger.error(`Error getUnpublished: ${err.message}`)
    return res.status(err.httpCode || 500).json({
      message: `Error getting materials with status neq PUBLISHED`,
      error: err.message
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
          } else if (dir.match(/^\/[A-z]{2,3}$/)) {
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
  addTranslation,
  update,
  remove,
  getLastMaterials,
  searchMaterials,
  getMaterialById,
  getUnpublished
}
