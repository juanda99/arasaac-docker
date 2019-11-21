const fs = require('fs-extra')
const randomize = require('randomatic')
const filenamify = require('filenamify')
const formidable = require('formidable')
const { ObjectID } = require('mongodb')
const path = require('path')
const CustomError = require('../utils/CustomError')
const logger = require('../utils/logger')
const { IMAGE_DIR, SVG_DIR } = require('../utils/constants')
const setPictogramModel = require('../models/Pictogram')
const stopWords = require('../utils/stopWords')
const languages = require('../utils/languages')
const { saveFiles } = require('./utils')
const _ = require('lodash')

const Pictograms = languages.reduce((dict, language) => {
  dict[language] = setPictogramModel(language)
  return dict
}, {})

const isEmptyObject = obj =>
  Object.entries(obj).length === 0 && obj.constructor === Object

// similar to getNewPictograms (publicApi) but with time instead of days

const getPictogramsFromDate = async (req, res) => {
  const { lastUpdated, locale } = req.params
  try {
    const pictograms = await Pictograms[locale].find({
      lastUpdated: { $gt: new Date(lastUpdated) }
    })
    console.log(pictograms)
    if (pictograms.length === 0) return res.status(404).json([]) // send http code 404!!!
    return res.json(pictograms)
  } catch (err) {
    return res.status(500).json({
      message: 'Error searching pictogram. See error field for detail',
      error: err
    })
  }
}

const getAll = async (req, res) => {
  const { locale } = req.params
  try {
    const pictograms = await Pictograms[locale].find()
    if (pictograms.length === 0) return res.status(404).json([]) // send http code 404!!!
    return res.json(pictograms)
  } catch (err) {
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}

const upload = async (req, res, next) => {
  const form = new formidable.IncomingForm()
  form.encoding = 'utf-8'
  form.keepExtensions = true
  form.multiples = true
  // form.uploadDir = `${__dirname}/uploads`
  form.parse(req, async (err, fields, files) => {
    if (err) logger.error(`ERROR UPLOADING PICTOGRAMS: ${err.message}`)
    try {
      // get last file id:
      const svgFiles = await fs.readdir(SVG_DIR)
      const EXTENSION = '.svg'
      /* filter only *.svg files with numeric basename */
      const targetFiles = svgFiles
        .filter(
          file =>
            path.extname(file).toLowerCase() === EXTENSION &&
            !isNaN(path.basename(file, EXTENSION))
        )
        .map(file => path.basename(file, EXTENSION))
      let number = Math.max(...targetFiles)
      let i = 1
      // can upload one file or more... when just one we don't receive an array.
      const imageFiles = Array.isArray(files.files)
        ? files.files
        : [files.files]
      const pictograms = []

      for (const file of imageFiles) {
        // if filename is a number, it means we are updating previous file...
        if (isNaN(path.basename(file.name, EXTENSION))) {
          const idPicto = number + i
          pictograms.push({ idPictogram: idPicto })
          logger.debug(`Saving file ${idPicto}.svg`)
          await saveFiles(file, SVG_DIR, `${idPicto}.svg`)
          logger.debug(`Saved OK file ${idPicto}.svg`)
          i += 1
        } else {
          logger.debug(`Updating file ${file.name}`)
          // we delete previousely so modified svg can get new pngs
          const idPicto = path.basename(file.name, EXTENSION)
          const fileExists = await fs.pathExists(
            path.resolve(SVG_DIR, file.name)
          )
          if (fileExists) {
            logger.debug(
              `Removing previous file and associated pngs ${path.resolve(
                SVG_DIR,
                file.name
              )}`
            )
            await fs.remove(path.resolve(SVG_DIR, file.name))
            await fs.remove(path.resolve(IMAGE_DIR, idPicto))
            logger.debug(
              `Removed OK previous file and associated pngs ${path.resolve(
                SVG_DIR,
                file.name
              )}`
            )
            await saveFiles(file, SVG_DIR)
            logger.debug(`Updated OK file ${file.name}`)
          } else {
            // file does not exist
            const idPicto = path.basename(file.name, EXTENSION)
            logger.debug(`Saving file ${file.name}`)
            pictograms.push({ idPictogram: idPicto })
            await saveFiles(file, SVG_DIR)
            logger.debug(`Saved OK file ${file.name}`)
          }
        }
      }
      if (pictograms.length) {
        // if new, we insert them into all picto collections
        for (const language of languages) {
          logger.debug(
            `Inserting new pictograms into mongodb with language ${language}`
          )
          await Pictograms[language].insertMany(pictograms)
          logger.debug(
            `Inserted OK new pictograms into mongodb with language ${language}`
          )
        }
      }
      return res.status(201).json({})
    } catch (err) {
      console.log(err)
      return res.status(500).json({
        message: 'Error uploading pictograms',
        error: err
      })
    }
  })
}

const update = async (req, res) => {
  const { locale, pictogram } = req.body
  const { _id, idPictogram } = pictogram

  const now = Date.now()
  const globalData = [
    'published',
    'available',
    'tags',
    'categories',
    'schematic',
    'violence',
    'sex',
    'synsets'
  ]
  // specificData = ['keywords', 'desc']
  const globalUpdate = {}
  const specificUpdate = {}

  try {
    if (!ObjectID.isValid(_id)) throw new CustomError(`Invalid id: ${_id}`, 404)
    const Pictogram = await Pictograms[locale].findById(_id).lean()
    if (!Pictogram) {
      throw new CustomError(
        `No pictogram found with id: ${_id} for locale: ${locale}`,
        404
      )
    }
    // if keyword == null we remove it
    const keywords = pictogram.keywords.filter(keyword => keyword !== null)
    if (!isArrayEqual(keywords, Pictogram.keywords)) {
      specificUpdate.keywords = keywords
    }

    if (pictogram.desc !== Pictogram.desc) specificUpdate.desc = pictogram.desc
    if (pictogram.validated !== Pictogram.validated) {
      specificUpdate.validated = pictogram.validated
    }
    if (req.user.role === 'admin') {
      for (const data of globalData) {
        if (Array.isArray(pictogram[data])) {
          if (!isArrayEqual(Pictogram[data], pictogram[data])) {
            globalUpdate[data] = pictogram[data]
          }
        } else if (Pictogram[data] !== pictogram[data]) {
          globalUpdate[data] = pictogram[data]
        }
      }
    }
    if (!isEmptyObject(specificUpdate) || !isEmptyObject(globalUpdate)) {
      Object.assign(specificUpdate, globalUpdate, { lastUpdated: now })
      logger.debug(
        `Updating general pictogram data into mongodb with language ${locale}`
      )
      var modifiedPictogram = await Pictograms[locale]
        .findByIdAndUpdate(_id, specificUpdate, { new: true })
        .lean()
      logger.debug(`Update OK pictogram into mongodb with language ${locale}`)
    } else {
      // should never be here but autosave in admin frontend when changing language need this fix:
      // in case of null keywords, we put them again here
      Pictogram.keywords = pictogram.keywords
      res.json(Pictogram)
    }

    /* if changes, we update */

    /* we get data from specific fields for all languages if modified, only with admin role */

    /* if modified.. we upgrade */
    if (!isEmptyObject(globalUpdate)) {
      globalUpdate.lastUpdated = now
      for (const language of languages) {
        if (language === locale) continue
        logger.debug(
          `Updating general pictogram data into mongodb with language ${language}`
        )

        await Pictograms[language].findOneAndUpdate(
          { idPictogram },
          globalUpdate
        )
        logger.debug(
          `Update OK pictogram into mongodb with language ${language}`
        )
      }
    }
    // so we can leave null items for form, but not in mongo
    modifiedPictogram.keywords = pictogram.keywords
    res.json(modifiedPictogram)
  } catch (err) {
    logger.error(`Error updating pictogram: ${err.message}`)
    res.status(err.httpCode || 500).json({
      message: 'Error updating pictogram. See error field for detail',
      error: err.message
    })
  }
}

/* not used, could be for searching in arasaac-admin, but we use public api endpoint */
const getPictogramsIdBySearch = async (req, res) => {
  const { locale, searchText } = req.params
  const filterSearchText = stopWords(searchText, locale)
  try {
    const pictograms = await Pictograms[locale]
      .find(
        {
          $text: {
            $search: filterSearchText,
            $language: 'none',
            $diacriticSensitive: false
          }
        },
        { score: { $meta: 'textScore' }, _id: 1, authors: 1 }
      )
      .sort({ score: { $meta: 'textScore' } })
    if (pictograms.length === 0) return res.status(404).json([])
    return res.json(pictograms)
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      message: 'Error getting pictogram keywords. See error field for detail',
      error: err
    })
  }
}

const getKeywordsById = async (req, res) => {
  const { id, locale } = req.params
  logger.debug(`Getting keywords for pictogram id ${id} and locale ${locale}`)
  try {
    const pictogram = await Pictograms[locale].findOne(
      {
        idPictogram: id
      },
      { keywords: 1, _id: 0 }
    )
    if (!pictogram) {
      logger.debug(`Pictogram with id ${id} not found`)
      return res.status(404).json([])
    }
    if (pictogram && pictogram.keywords) {
      const keywords = pictogram.keywords.map(keyword => ({
        keyword: keyword.keyword,
        type: keyword.type
      }))
      logger.debug(
        `Keywords pictogram id ${id}: ${keywords
          .map(keyword => keyword.keyword)
          .join()}`
      )
      return res.status(200).json({ keywords })
    } else {
      logger.debug(`No keywords found for pictogram id ${id}`)
      return res.status(404).json([])
    }
  } catch (err) {
    console.log(err)
    // TODO: return err o err.messsage?????
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}

const getTypesById = async (req, res) => {
  const { id } = req.params
  logger.debug(
    `Getting keyword ty pes for pictogram id ${id} searching in es locale`
  )
  try {
    const pictogram = await Pictograms['es'].findOne(
      {
        idPictogram: id
      },
      { keywords: 1, _id: 0 }
    )
    if (!pictogram) {
      logger.debug(`Pictogram with id ${id} not found`)
      return res.status(404).json([])
    }
    if (pictogram && pictogram.keywords) {
      const foundTypes = pictogram.keywords.map(keyword => keyword.type)
      const types = Array.from(new Set(foundTypes))
      return res.status(200).json({ types })
    } else {
      logger.debug(`No types found for pictogram id ${id}`)
      return res.status(404).json([])
    }
  } catch (err) {
    console.log(err)
    // TODO: return err o err.messsage?????
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}

/*
     Use for downloading custom pictograms made with canvas
*/
const postCustomPictogramFromBase64 = async (req, res) => {
  let { fileName, base64Data } = req.body
  base64Data = base64Data.replace(/^data:image\/png;base64,/, '')
  fileName = `${randomize('Aa0', 10)}-${filenamify(fileName, {
    replacement: ''
  }) || 'image'}.png`
  const destFileName = path.resolve(IMAGE_DIR, fileName)

  try {
    await fs.writeFile(destFileName, base64Data, 'base64')
    return res.status(201).json({ fileName })
    // res.download(destFileName, fileName)
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      message: 'Error generating pictogram. See error field for detail',
      error: err
    })
  }
}

const getCustomPictogramByName = (req, res) => {
  const { fileName } = req.params
  const destFileName = `/app/pictograms/${fileName}`
  try {
    const newFileName = fileName.substring(fileName.indexOf('-') + 1)
    res.download(destFileName, newFileName)
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      message: 'Error getting pictogram. See error field for detail',
      error: err
    })
  }
}

// TODO: remove sanitize, what i use in public api?
const getLocutionById = (req, res) => {
  const { id, locale, text } = req.params
  try {
    const locution = `/app/locutions/${locale}/${id}.mp3`
    console.log(locution)
    console.log('ha entrado')
    let locutionName = sanitize(text)
    locutionName = locutionName ? `${locutionName}.mp3` : `{$id}.mp3`
    res.download(locution, locutionName)
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      message: 'Error getting locution. See error field for detail',
      error: err
    })
  }
}

const isArrayEqual = (x, y) => {
  return _(x)
    .xorWith(y, _.isEqual)
    .isEmpty()
}

module.exports = {
  getPictogramsFromDate,
  getAll,
  getKeywordsById,
  getTypesById,
  getPictogramsIdBySearch,
  postCustomPictogramFromBase64,
  getCustomPictogramByName,
  getLocutionById,
  update,
  upload
}
