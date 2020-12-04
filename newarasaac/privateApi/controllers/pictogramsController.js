const fs = require('fs-extra')
const randomize = require('randomatic')
const filenamify = require('filenamify')
const formidable = require('formidable')
const jp = require('jsonpath')
const { ObjectID } = require('mongodb')
const path = require('path')
const CustomError = require('../utils/CustomError')
const logger = require('../utils/logger')
const { IMAGE_DIR, SVG_DIR, LOCUTIONS_DIR } = require('../utils/constants')
const setPictogramModel = require('../models/Pictogram')
const Category = require('../models/Category')
const removeDiacritics = require('../utils/removeDiacritics')
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
  logger.debug(
    `EXEC getPictogramsFromData with lastUpdated ${lastUpdated} and locale ${locale}`
  )
  try {
    const pictograms = await Pictograms[locale].find({
      lastUpdated: { $gt: new Date(lastUpdated) }
    })
    if (pictograms.length === 0) return res.status(404).json([]) // send http code 404!!!
    return res.json(pictograms)
  } catch (err) {
    logger.error(`Error searching pictogram ${err}`)
    return res.status(500).json({
      message: 'Error searching pictogram. See error field for detail',
      error: err
    })
  }
}

const downloadPictogram = async (req, res) => {
  const { fileName, keyword } = req.params
  const newName = keyword === null ? fileName : keyword
  logger.debug(`EXEC downloadPictogram for filename: ${fileName}`)
  const filePath = path.resolve(IMAGE_DIR, fileName, `${fileName}_500.png`)
  const exists = await fs.pathExists(filePath)
  if (!exists) {
    logger.error(`ERROR executing downloadPictogram for file: ${filePath} `)
    return res.status(404).json({})
  }
  logger.debug(`downloadPictogram ok for file: ${filePath}`)
  return res.download(filePath, `${newName}.png`)
}

const searchPictograms = async (req, res) => {
  /* we send all of them, in  frontend, we my hide them depending on user role */
  /* first we search by id or syncset, then by exact match (also plulral), categories and textScore */

  const locale = req.params.locale
  const fullSearchText  = req.params.searchText.toLowerCase()
  const searchText = stopWords(fullSearchText, locale)

  logger.debug(`EXEC searchPictograms with locale ${locale} and searchText ${fullSearchText}`)


  try {
    let pictogramsById
    if (isNaN(fullSearchText)) {
      pictogramsById = await Pictograms[locale]
        .find({
          synsets: fullSearchText
        })
        .select({ __v: 0 })
        .lean()
    } else {
      pictogramsById = await Pictograms[locale]
        .find({
          _id: fullSearchText
        })
        .select({ __v: 0 })
        .lean()
    }


    let pictogramsByKeyword = await Pictograms[locale]
      .find({
        $or: [
          {
            'keywords.keyword': fullSearchText
          },
          {
            'keywords.plural': fullSearchText
          }
        ]
      })
      .select({ __v: 0 })
      .lean()

      const category = await Category.findOne({ locale }, { _id: 0 })
      let pictogramsByCategory = []
      if (category) {
        const nodes = jp.nodes(category.data, '$..keywords');
        const categories = nodes
          .filter(node => node.value.some(keyword => removeDiacritics(stopWords(keyword, locale)).toLowerCase() === removeDiacritics(stopWords(fullSearchText, locale))))
          .map(node=>node.path[node.path.length -2])
        if (categories.length) {
          const subCategories = []
          categories.forEach(categoryItem => {
            const partialData = jp.value(category.data, `$..["${categoryItem}"]`)
            const newCategories = getSubcategories(partialData, [categoryItem])
            newCategories.forEach(element => {
              subCategories.push(element)
            });
          })
        // const partialData = jp.value(category.data, `$..["${categories[0]}"]`)
        // const subCategories = getSubcategories(partialData, [categories[0]])
          pictogramsByCategory = await Pictograms[locale]
            .find({
              categories: { $in: subCategories }
            })
            .select({ __v: 0 })
            .lean()
          
          pictogramsByCategory.sort((a, b) =>{
            const aPosition = subCategories.reduce((accumulator, currentValue)=>{
              const position = a.categories.indexOf(currentValue)
              return position === -1 ? accumulator : Math.min(position, accumulator)
            }, 100)
            const bPosition = subCategories.reduce((accumulator, currentValue)=>{
              const position = b.categories.indexOf(currentValue)
              return position === -1 ? accumulator : Math.min(position, accumulator)
            }, 100)
            let  position = aPosition - bPosition
            /* hack para poner los animales de mar por delante de los  verbos en comida por ej */
            if (position === 0) position  = a.categories.length - b.categories.length
            return position
          })
        }
      }

    /* if  category, we don't look by text */
    let pictogramsByText  = []
    if (!pictogramsByCategory.length) {
      pictogramsByText = await Pictograms[locale]
        .find(
          {
            $text: {
              $search: searchText,
              $language: 'none',
              $diacriticSensitive: false
            }
          },
          { score: { $meta: 'textScore' } }
        )
        .select({ __v: 0 })
        .lean()
    }

    // pictogramsByText.forEach(pictogram =>
    //   Reflect.deleteProperty(pictogram, 'score'))

    let pictograms = [
      ...pictogramsById,
      ...pictogramsByKeyword,
      ...pictogramsByCategory,
      ...pictogramsByText
    ]

    const uniquePictograms = Array.from(new Set(pictograms.map(pictogram => pictogram._id))).map(_id => pictograms.find(a => a._id === _id))

    if (uniquePictograms.length === 0) return res.status(404).json([])
    logger.debug(`Found ${uniquePictograms.length} pictograms`)
    return res.json(uniquePictograms)
  } catch (err) {
    logger.error(`Error getting pictograms with locale ${locale} and searchText ${fullSearchText}. See error: ${err}`)
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}

const getSubcategories = (tree, categories) => {
  if (tree.children && Object.keys(tree.children).length !== 0 ) {
    return Object.entries(tree.children).reduce(
      (accumulator, currentValue) => {
        if (currentValue[0]) categories.push(currentValue[0])
        return getSubcategories(currentValue[1], categories)
      }, [])
  }
  return categories
}



const getAll = async (req, res) => {
  const { locale } = req.params
  logger.debug(`EXEC getAll with locale ${locale} `)
  try {
    const pictograms = await Pictograms[locale].find()
    if (pictograms.length === 0) return res.status(404).json([]) // send http code 404!!!
    return res.json(pictograms)
  } catch (err) {
    logger.error(`Error getting all pictograms ${err} `)
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}

const getPictogramById = async (req, res) => {
  const { _id, locale } = req.params
  logger.debug(`EXEC getPictogramById with id ${_id} and locale ${locale} `)
  try {
    let pictogram = await Pictograms[locale].findOne({ _id }, { __v: 0 })
    logger.debug(`Search pictogram with id ${_id} and locale ${locale} `)
    if (!pictogram) {
      logger.debug(`Not found pictogram with id ${_id} and locale ${locale} `)
      return res.status(404).json({})
    }
    return res.json(pictogram)
  } catch (err) {
    logger.error(
      `Error getting pictogram with id ${_id} and locale ${locale}.See error: ${err} `
    )
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}

/* Used to get favorites from user, providing id's from redux store */
/* Not moved to public api yet... */
const getPictogramsById = async (req, res) => {
  const { locale } = req.params
  const favoriteIds = [].concat.apply([], req.body.favoriteIds)
  logger.debug(
    `EXEC getPictogramByIds with ids ${favoriteIds} and locale ${locale} `
  )
  try {
    const pictograms = await Pictograms[locale].find(
      {
        _id: { $in: favoriteIds },
        published: true
      },
      { published: 0, validated: 0, available: 0, __v: 0 }
    )
    logger.debug(`Search pictogram with id ${favoriteIds} and locale ${locale} `)
    if (!pictograms.length) {
      logger.debug(
        `Not found pictograms with ids ${favoriteIds} and locale ${locale} `
      )
      return res.json([])
    }
    return res.json(pictograms)
  } catch (err) {
    logger.error(
      `Error getting pictogram with id ${favoriteIds} and locale ${locale}.See error: ${err} `
    )
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}

const upload = async (req, res, next) => {
  logger.debug(`EXEC upload in pictogramsController`)
  const form = new formidable.IncomingForm()
  form.encoding = 'utf-8'
  form.keepExtensions = true
  form.multiples = true
  // form.uploadDir = `${ __dirname } /uploads`
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
          pictograms.push({ _id: idPicto })
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
            pictograms.push({ _id: idPicto })
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
      logger.error(`ERROR executing upload: ${err}`)
      return res.status(500).json({
        message: 'Error uploading pictograms',
        error: err
      })
    }
  })
}

const update = async (req, res) => {
  const { locale, pictogram } = req.body
  const { _id } = pictogram

  logger.debug(
    `EXEC update with locale ${locale}, pictogram ${JSON.stringify(
      pictogram
    )}, _id: ${_id}`
  )

  /* first we test auth for translators */
  if (
    req.user.role === 'translator' &&
    req.user.targetLanguages.indexOf(locale) === -1
  ) {
    logger.debug(`Role is translator but can't translate to ${locale}`)
    return res.status(403).json({
      message: 'Error getting user data',
      error: `Role is translator but can't translat to ${locale} language`
    })
  }

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
      const locutionsFiles = req.app.get('locutionsFiles')
      specificUpdate.keywords = keywords.map(keyword => {
        if (
          locutionsFiles[locale].indexOf(
            keyword.keyword.toString().toLowerCase()
          ) === -1
        ) {
          keyword.hasLocution = false
        } else {
          keyword.hasLocution = true
        }
        return keyword
      })
    }

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
      return res.json(Pictogram)
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

        await Pictograms[language].findOneAndUpdate({ _id }, globalUpdate)
        logger.debug(
          `Update OK pictogram into mongodb with language ${language}`
        )
      }
    }
    // so we can leave null items for form, but not in mongo
    modifiedPictogram.keywords = pictogram.keywords
    return res.json(modifiedPictogram)
  } catch (err) {
    logger.error(`Error updating pictogram: ${err.message}`)
    return res.status(err.httpCode || 500).json({
      message: 'Error updating pictogram. See error field for detail',
      error: err.message
    })
  }
}

/* not used, could be for searching in arasaac-admin, but we use public api endpoint */
const getPictogramsIdBySearch = async (req, res) => {
  const { locale, searchText } = req.params
  logger.debug(
    `EXEC getPictogramsIdBySearch with locale ${locale} and searchText ${searchText}`
  )
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
    logger.error(
      `Error executing getPictogramsIdBySearch with locale ${locale} and searchText ${searchText}: ${err}`
    )
    return res.status(500).json({
      message: 'Error getting pictogram keywords. See error field for detail',
      error: err
    })
  }
}

const getKeywordsById = async (req, res) => {
  const { _id, locale } = req.params
  logger.debug(
    `EXEC getKeywordsById for pictogram id ${_id} and locale ${locale}`
  )
  try {
    const pictogram = await Pictograms[locale].findOne(
      {
        _id
      },
      { keywords: 1 }
    )
    if (!pictogram) {
      logger.debug(`Pictogram with id ${_id} not found`)
      return res.status(404).json([])
    }
    if (pictogram && pictogram.keywords) {
      const keywords = pictogram.keywords.map(keyword => ({
        keyword: keyword.keyword,
        type: keyword.type
      }))
      logger.debug(
        `Keywords pictogram id ${_id}: ${keywords
          .map(keyword => keyword.keyword)
          .join()}`
      )
      return res.status(200).json({ keywords: pictogram.keywords })
    } else {
      logger.debug(`No keywords found for pictogram id ${_id}`)
      return res.status(404).json([])
    }
  } catch (err) {
    logger.error(
      `Error executing getKeywordsById with id ${_id} and locale ${locale}: ${err}`
    )
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}

const getTypesById = async (req, res) => {
  const { _id } = req.params
  logger.debug(
    `EXEC getYpesById for pictogram id ${_id} searching in es locale`
  )
  try {
    const pictogram = await Pictograms['es'].findOne(
      {
        _id
      },
      { keywords: 1, _id: 0 }
    )
    if (!pictogram) {
      logger.debug(`Pictogram with id ${_id} not found`)
      return res.status(404).json([])
    }
    if (pictogram && pictogram.keywords) {
      const foundTypes = pictogram.keywords.map(keyword => keyword.type)
      const types = Array.from(new Set(foundTypes))
      return res.status(200).json({ types })
    } else {
      logger.debug(`No types found for pictogram id ${_id}`)
      return res.status(404).json([])
    }
  } catch (err) {
    logger.error(`ERROR executing getTypesById with _id: ${_id}`)
    // TODO: return err o err.messsage?????
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}

const remove = async (req, res) => {
  const { _id } = req.params
  logger.debug(`EXEC remove for pictogram id ${_id}`)
  try {
    for (const language of languages) {
      logger.debug(`Deleting pictogram id ${_id} in language ${language}`)
      await Pictograms[language].deleteOne({ _id })
      logger.debug(`Deleted pictogram id ${_id} in language ${language}`)
    }
    logger.debug(
      `Deleting svg and png files if exist for pictogram with id ${_id}`
    )
    await Promise.all([
      fs.remove(path.resolve(SVG_DIR, `${_id}.svg`)),
      fs.remove(path.resolve(IMAGE_DIR, _id))
    ])
    logger.debug(
      `Deleted svg and png files if exist for pictogram with id ${_id}`
    )
    return res.status(204).json()
  } catch (err) {
    logger.error(`ERROR executing remove for pictogram with id: ${_id}`)
    // TODO: return err o err.messsage?????
    return res.status(500).json({
      message: 'Error removing pictogram. See error field for detail',
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
  const destFileName = `${IMAGE_DIR}/${fileName}`
  logger.debug(`EXEC getCustomPictogramByName for fileName ${fileName}`)
  try {
    const newFileName = fileName.substring(fileName.indexOf('-') + 1)
    res.download(destFileName, newFileName)
  } catch (err) {
    logger.error(`ERROR getCustomPictogramByName for fileName ${fileName}`)
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
    const locution = `${LOCUTIONS_DIR}/${locale}/${id}.mp3`
    // let locutionName = sanitize(text)
    // locutionName = locutionName ? `${locutionName}.mp3` : `{$id}.mp3`
    res.download(locution, `${id}.mp4`)
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
  getPictogramById,
  getPictogramsById,
  getKeywordsById,
  getTypesById,
  getPictogramsIdBySearch,
  postCustomPictogramFromBase64,
  getCustomPictogramByName,
  getLocutionById,
  update,
  upload,
  searchPictograms,
  downloadPictogram,
  remove
}
