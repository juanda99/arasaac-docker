const fs = require('fs-extra')
const path = require('path')
const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
// we load pictos model for all languages
const setPictogramModel = require('../models/Pictograms')
const stopWords = require('../utils/stopWords')
const { IMAGE_DIR, SVG_DIR, IMAGE_URL } = require('../config')

const languages = require('../utils/languages')
const logger = require('../utils/logger')
const { convertSVG, getPNGFileName, modifySVG } = require('../utils/svg')

const Synsets = require('../models/Synsets')
const Pictograms = languages.reduce((dict, language) => {
  dict[language] = setPictogramModel(language)
  return dict
}, {})

const getPictogramById = async (req, res) => {
  const _id = req.swagger.params.idPictogram.value
  const locale = req.swagger.params.locale.value
  try {
    let pictogram = await Pictograms[locale].findOne(
      { _id, published: true },
      { published: 0, validated: 0, available: 0, desc: 0, __v: 0 }
    )
    logger.debug(`Search pictogram with id ${_id} and locale ${locale}`)
    if (!pictogram) {
      logger.debug(`Not found pictogram with id ${_id} and locale ${locale}`)
      return res.status(404).json()
    }
    return res.json(pictogram)
  } catch (err) {
    logger.err(`Error getting pictogram with id ${_id} and locale ${locale}. See error: ${err}`)
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}

const getPictogramsBySynset = async (req, res) => {
  let synset = req.swagger.params.synset.value
  const locale = req.swagger.params.locale.value
  let wordnet = req.swagger.params.wordnet.value
  wordnet = wordnet.replace(/\./g, '')

  logger.debug(`Searching pictogram by synset: wordnet ${wordnet}, id: ${synset}`)

  try {
    if (wordnet !== '31') {
      const key = `old_keys.pwn${wordnet}`
      // we neeed to get syncset for wordnet3.1
      const data = await Synsets.findOne({ [key]: synset }, { id: 1, _id: 0 })
      if (!data) {
        logger.debug(`Syncset ${synset} not found for Wordnet ${wordnet} in our data`)
        return res.status(404).json({
          error: `Syncset ${synset} not found for Wordnet ${wordnet} in our data`
        })
      }
      synset = data.id
      logger.debug(`Obtained wordnet 3.1 id: ${synset}`)
    }

    let pictogram = await Pictograms[locale].find(
      { synsets: synset, published: true },
      { published: 0, validated: 0, available: 0, desc: 0, __v: 0 }
    )
    if (!pictogram) {
      logger.debug(`No pictogram found for Wordnet v3.1 id ${synset}`)
      return res.status(404).json({
        error: `No pictogram found for Wordnet v3.1 id ${synset}`
      })
    }
    logger.debug(`Pictograms found for Wordnet v3.1 id ${synset}`)
    return res.json(pictogram)
  } catch (err) {
    logger.err(`Error getting pictograms. See error: ${err}`)
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}

const getPictogramFileById = async (req, res) => {
  const file = `${req.swagger.params.idPictogram.value}.svg`
  /* eslint-disable multiline-ternary */
  const url = req.swagger.params.url.value === true
  const options = {
    plural: req.swagger.params.plural.value || false,
    color:
      req.swagger.params.color.value === false
        ? req.swagger.params.color.value
        : true,
    backgroundColor: req.swagger.params.backgroundColor.value || false,
    action: req.swagger.params.action.value || 'present',
    resolution: req.swagger.params.resolution.value || 500,
    skin: req.swagger.params.skin.value || false,
    hair: req.swagger.params.hair.value || false,
    identifier: req.swagger.params.identifier.value,
    identifierPosition: req.swagger.params.identifierPosition.value
  }
  const download = req.swagger.params.download.value || false
  /* eslint-enable multiline-ternary */
  try {
    const fileName = await getPNGFileName(file, options)
    const exists = await fs.pathExists(fileName)
    if (exists) {
      if (url) return res.json({
        image: fileName.replace(IMAGE_DIR, IMAGE_URL)
      })
      if (!download) return res.sendFile(fileName)
      return res.download(fileName)
    }
    const svgContent = await fs.readFile(path.resolve(SVG_DIR, file), 'utf-8')
    let newSVGContent = modifySVG(svgContent, options)
    convertSVG(newSVGContent, options.resolution)
      .then(buffer =>
        imagemin.buffer(buffer, {
          plugins: [imageminPngquant({ quality: '65-80', speed: 10 })]
        }))
      .then(buffer => {
        fs.open(fileName, 'w', function (err, fd) {
          if (err) {
            throw 'could not open file: ' + err
          }
          // write the contents of the buffer, from position 0 to the end, to the file descriptor returned in opening our file
          fs.write(fd, buffer, 0, buffer.length, null, function (err) {
            if (err) throw 'error writing file: ' + err
            fs.close(fd, function () {
              console.log(`IMAGE GENERATED: ${fileName}`)
              if (url) res.json({
                image: fileName.replace(IMAGE_DIR, IMAGE_URL)
              })
              else if (download) res.download(fileName)
              else res.sendFile(fileName)
            })
          })
        })
      })
  } catch (err) {
    logger.err(`Error generating pictogram. See error: ${err}`)
    return res.status(500).json({
      message: 'Error generating pictogram. See error field for details',
      error: err
    })
  }
}

const searchPictograms = async (req, res) => {
  const locale = req.swagger.params.locale.value
  const searchText = stopWords(req.swagger.params.searchText.value, locale)
  logger.debug(`EXEC searchPictograms with locale ${locale} and searchText ${searchText}`)

  /* primero haremos búsqueda exacta, también con plural, luego añadiremos textScore,
  y por último categoría exacta */
  try {
    let pictogramsByKeyword = await Pictograms[locale]
      .find({
        $or: [
          {
            'keywords.keyword': req.swagger.params.searchText.value
          },
          {
            'keywords.plural': req.swagger.params.searchText.value
          }
        ],
        published: true
      })
      .select({ published: 0, validated: 0, available: 0, desc: 0, __v: 0 })
      .lean()

    console.log(pictogramsByKeyword, '******')

    let pictogramsByText = await Pictograms[locale]
      .find(
        {
          $text: {
            $search: searchText,
            $language: 'none',
            $diacriticSensitive: false
          },
          published: true
        },
        { score: { $meta: 'textScore' } }
      )
      .select({ published: 0, validated: 0, available: 0, desc: 0, __v: 0 })
      .sort({ score: { $meta: 'textScore' } })
      .lean()

    // pictogramsByText.forEach(pictogram =>
    //   Reflect.deleteProperty(pictogram, 'score'))

    let pictograms = [
      ...pictogramsByKeyword,
      ...pictogramsByText
    ]

    const uniquePictograms = Array.from(new Set(pictograms.map(pictogram => pictogram._id))).map(_id => pictograms.find(a => a._id === _id))

    if (uniquePictograms.length === 0) return res.status(404).json([])
    logger.debug(`Found ${uniquePictograms.length} pictograms`)
    return res.json(uniquePictograms)
  } catch (err) {
    logger.err(`Error getting pictograms with locale ${locale} and searchText ${searchText}. See error: ${err}`)
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}

const bestSearchPictograms = async (req, res) => {
  const locale = req.swagger.params.locale.value
  logger.debug(`EXEC searchPictograms with locale ${locale} and searchText ${req.swagger.params.searchText.value}`)

  /* primero haremos búsqueda exacta, también con plural, luego añadiremos textScore,
  y por último categoría exacta */
  try {
    let pictogramsByKeyword = await Pictograms[locale]
      .find({
        $or: [
          {
            'keywords.keyword': req.swagger.params.searchText.value
          },
          {
            'keywords.plural': req.swagger.params.searchText.value
          }
        ],
        published: true
      })
      .select({ published: 0, validated: 0, available: 0, desc: 0, __v: 0 })
      .lean()

    if (pictogramsByKeyword.length === 0) return res.status(404).json([])
    logger.debug(`Found ${pictogramsByKeyword.length} pictograms`)
    return res.json(pictogramsByKeyword)
  } catch (err) {
    logger.err(`Error getting pictograms with locale ${locale} and searchText ${searchText}. See error: ${err}`)
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}

const getNewPictograms = async (req, res) => {
  let days = req.swagger.params.days.value
  var locale = req.swagger.params.locale.value
  let startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  logger.debug(`Searching new pictograms in the last ${days} days with locale ${locale}`)
  try {
    let pictograms = await Pictograms[locale]
      .find({ lastUpdated: { $gt: startDate }, published: true })
      .select({ published: 0, validated: 0, available: 0, __v: 0 })
      .sort({ lastUpdated: -1 })
    if (pictograms.length === 0) {
      logger.debug(`No new pictograms in the last ${days} days with locale ${locale}`)
      return res.status(404).json([]) //send http code 404!!!
    }
    return res.json(pictograms)
  } catch (err) {
    logger.err(`Error getting new pictograms. See error: ${err}`)
    return res.status(500).json({
      message: 'Error gettings new pictogram. See error field for detail',
      error: err
    })
  }
}

const getLastPictograms = async (req, res) => {
  const numItems = req.swagger.params.numItems.value
  var locale = req.swagger.params.locale.value
  logger.info(`Getting last {numItems} pictograms for locale ${locale}.`)
  try {
    let pictograms = await Pictograms[locale]
      .find({ published: true })
      .select({ published: 0, validated: 0, available: 0, desc: 0, __v: 0 })
      .sort({ lastUpdated: -1 })
      .limit(numItems)
    if (pictograms.length === 0) {
      logger.info(`No pictograms found for locale ${locale}.`)
      return res.status(404).json([])
    } //send http code 404!!!
    return res.json(pictograms)
  } catch (err) {
    logger.err(`Error getting last {numItems} pictograms for locale ${locale}. See error: ${err}`)
    return res.status(500).json({
      message: 'Error searching pictogram. See error field for detail',
      error: err
    })
  }
}

module.exports = {
  getPictogramById,
  getPictogramFileById,
  getPictogramsBySynset,
  searchPictograms,
  bestSearchPictograms,
  getNewPictograms,
  getLastPictograms
}
