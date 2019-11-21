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
  const id = req.swagger.params.idPictogram.value
  const locale = req.swagger.params.locale.value
  try {
    let pictogram = await Pictograms[locale]
      .findOne({ idPictogram: id })
      .populate('authors', '_id name')
    if (!pictogram) return res.status(404).json()
    return res.json(pictogram)
  } catch (err) {
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

    let pictogram = await Pictograms[locale]
      .find({ synsets: synset })
      .populate('authors', '_id name')
    if (!pictogram) {
      logger.debug(`No pictogram found for Wordnet v3.1 id ${synset}`)
      return res.status(404).json({
        error: `No pictogram found for Wordnet v3.1 id ${synset}`
      })
    }
    logger.debug(`Pictograms found for Wordnet v3.1 id ${synset}: JSON.stringify(pictogram)`)
    return res.json(pictogram)
  } catch (err) {
    logger.err(`Error getting pictograms: ${err}`)
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}

const getPictogramFileById = async (req, res) => {
  console.log('kkkkkkk')
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
    console.log(exists)
    console.log(`Download: ${JSON.stringify(download)}`)
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
        fs.open(fileName, 'w', function(err, fd) {
          if (err) {
            throw 'could not open file: ' + err
          }
          // write the contents of the buffer, from position 0 to the end, to the file descriptor returned in opening our file
          fs.write(fd, buffer, 0, buffer.length, null, function(err) {
            if (err) throw 'error writing file: ' + err
            fs.close(fd, function() {
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
    console.log(err)
    return res.status(500).json({
      message: 'Error generating pictogram. See error field for details',
      error: err
    })
  }
}

const searchPictograms = async (req, res) => {
  const locale = req.swagger.params.locale.value
  const searchText = stopWords(req.swagger.params.searchText.value, locale)
  console.log(`searchText filtered:  ${searchText}`)

  /* primero haremos búsqueda exacta, también con plural, luego añadiremos textScore,
  y por último categoría exacta */
  try {
    let pictogramsByKeyword = await Pictograms[locale]
      .find({
        $or: [
          {
            'keywords.keyword': searchText
          },
          {
            'keywords.plural': searchText
          }
        ]
      })
      .populate('authors', '_id name')
      .lean()

    let pictogramsByText = await Pictograms[locale]
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
      .populate('authors', '_id name')
      .sort({ score: { $meta: 'textScore' } })
      .lean()

    // const pictogramsByTextFilterd = pictogramsByText.map(
    //   ({ score, ...items }) => items
    // )
    pictogramsByText.forEach(pictogram =>
      Reflect.deleteProperty(pictogram, 'score'))

    let pictograms = [
      ...pictogramsByKeyword,
      ...pictogramsByText
    ]

    const uniquePictograms = Array.from(new Set(pictograms.map(pictogram => pictogram.idPictogram))).map(idPictogram => pictograms.find(a => a.idPictogram === idPictogram))

    if (uniquePictograms.length === 0) return res.status(404).json([])
    return res.json(uniquePictograms)
  } catch (err) {
    console.log(err)
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
  try {
    let pictograms = await Pictograms[locale]
      .find({ lastUpdated: { $gt: startDate } })
      .sort({ lastUpdated: -1 })
      .populate('authors', '_id name')
    if (pictograms.length === 0) return res.status(404).json([]) //send http code 404!!!
    return res.json(pictograms)
  } catch (err) {
    return res.status(500).json({
      message: 'Error searching pictogram. See error field for detail',
      error: err
    })
  }
}

const getLastPictograms = async (req, res) => {
  const numItems = req.swagger.params.numItems.value
  var locale = req.swagger.params.locale.value
  try {
    let pictograms = await Pictograms[locale]
      .find()
      .sort({ lastUpdated: -1 })
      .limit(numItems)
      .populate('authors', '_id name')
    if (pictograms.length === 0) return res.status(404).json([]) //send http code 404!!!
    return res.json(pictograms)
  } catch (err) {
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
  getNewPictograms,
  getLastPictograms
}
