const fs = require('fs-extra')
const path = require('path')
const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
// we load pictos model for all languages
const setPictogramModel = require('../models/Pictograms')
const stopWords = require('../utils/stopWords')
const IMAGE_DIR = process.env.IMAGE_DIR || '/app/pictos'
const SVG_DIR = process.env.SVG_DIR || '/app/svg'

const languages = require('../utils/languages')
const { convertSVG, getPNGFileName, modifySVG } = require('../utils/svg')

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
      .populate('authors')
    if (!pictogram) return res.status(404).json()
    return res.json(pictogram)
  } catch (err) {
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
    identity: req.swagger.params.identity.value,
    identityPosition: req.swagger.params.identityPosition.value
  }
  const download = req.swagger.params.download || false
  /* eslint-enable multiline-ternary */
  try {
    const fileName = await getPNGFileName(file, options)
    const exists = await fs.pathExists(file)
    if (exists && download) res.download(fileName)
    else if (exists && !download) res.sendFile(fileName)
    const svgContent = await fs.readFile(path.resolve(SVG_DIR, file), 'utf-8')
    let newSVGContent = modifySVG(svgContent, options)
    console.log(newSVGContent)
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
                image: fileName.replace(
                  IMAGE_DIR,
                  'https://static.arasaac.org/pictograms'
                )
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
  try {
    let pictograms = await Pictograms[locale]
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
      .populate('authors')
      .sort({ score: { $meta: 'textScore' } })
    if (pictograms.length === 0) return res.status(404).json([])
    return res.json(pictograms)
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
      .find({ lastUpdate: { $gt: startDate } })
      .sort({ lastUpdate: -1 })
      .populate('authors')
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
      .sort({ lastUpdate: -1 })
      .limit(numItems)
      .populate('authors')
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
  searchPictograms,
  getNewPictograms,
  getLastPictograms
}
