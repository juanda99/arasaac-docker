
const sharp = require('sharp')
const fs = require('fs-extra')
const path = require('path')
var imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
// we load pictos model for all languages
const setPictogramModel = require('../models/Pictograms')
const stopWords = require('../utils/stopWords')
const IMAGE_DIR = process.env.IMAGE_DIR || '/app/pictos'
const SVG_DIR = process.env.SVG_DIR || '/app/svg'
const languages = [
  'es',
  'ru',
  'ro',
  'ara', // instead of ar
  'zhs', // instead of zh, zhs simplified chineese zht traditional chineese
  'bg', // not available
  'pl', // not available
  'en',
  'fr',
  'ca', // not available
  'eu', // not available
  'de',
  'it',
  'pt',
  'ga', // not available
  'br', // not available, should we use pt?
  'cr', // not available
  'val' // not available
]

const Pictograms = languages.reduce((dict, language)=> {
  dict[language]= setPictogramModel(language)
  return dict
}, {})

const getNextLayer = (layer) => {
  const layers = ['Fondo', 'contorno2', 'relleno', 'contorno']
  const layerIndex = layers.indexOf(layer) +1;
  if (layerIndex<3) {
    return `<g id="${layers[layerIndex]}">`;
  }
  else return '</svg>';
}

const modifySVG = (fileContent, layer, layerText) => {
  const startAt = `<g id="${layer}">`
  const finishAt = getNextLayer(layer)
  let s = fileContent.indexOf(startAt)
  let f = fileContent.indexOf(finishAt)
  return `${fileContent.substr(0, s)}<g id="${layer}">${layerText}</g>\n${fileContent.substr(f)}`
}

const getPNGFileName = (file, resolution) => path.resolve(IMAGE_DIR, `${path.basename(file, '.svg')}_${resolution}.png` )

const convertSVG = (fileContent, resolution) => {
  // density 450p is for 3125x image
  const density = parseInt(0.144 * resolution)
  const fileBuffer = Buffer.from(fileContent)
  console.log(fileBuffer)
  console.log('ssssssssssssssssssssssssssssssssssssssssssssssssssssss')
  return sharp(fileBuffer).png().toBuffer()
}

module.exports = {
  getPictogramById: async (req, res) => {
    const id = req.swagger.params.idPictogram.value
    const locale = req.swagger.params.locale.value
    try{
      let pictogram = await Pictograms[locale]
        .findOne({idPictogram: id})
        .populate('authors')
      if(!pictogram) return res.status(404).json()
      return res.json(pictogram)
    } catch(err){
      return res.status(500).json({
        message: 'Error getting pictograms. See error field for detail',
        error: err
      })
    }
  },

  getPictogramFileById: async (req, res) => {
    const file = `${req.swagger.params.idPictogram.value}.svg`
    const options = req.body
    console.log(file)
    console.log(options)
    const resolution = 500
    try {
      const svgContent = await fs.readFile(path.resolve(SVG_DIR, file), 'utf-8')
      const backgroundColor='#CCC'
      const layer = 'Fondo'
      const resolution = 500
      const layerContent = `<rect x="-54" y="147" style="fill:${backgroundColor};" width="500" height="500"/>`
      console.log(svgContent)
      let newSVGContent = modifySVG(svgContent, layer, layerContent )
      console.log('---------------------------------------')
      console.log(newSVGContent)
      const fileName = getPNGFileName(file, resolution)

      convertSVG(newSVGContent, resolution)
      .then (buffer => {
        console.log('5555555555555555555555555555555555')
        return imagemin.buffer(buffer, {
          plugins: [
            imageminPngquant({quality: '65-80', speed: 10})
          ]
        })
      })
      .then(buffer => {
        console.log('**************************************************')
        fs.open(fileName, 'w', function(err, fd) {  
          if (err) {
              throw 'could not open file: ' + err
          }
          console.log("????????????????????????????????????????????????????")
          // write the contents of the buffer, from position 0 to the end, to the file descriptor returned in opening our file
          fs.write(fd, buffer, 0, buffer.length, null, function(err) {
            console.log('111111111111111111111111111111111111111')
              if (err) throw 'error writing file: ' + err
              console.log('2222222222222222222222222222222')
              fs.close(fd, function() {
                // logger.info(`IMAGE GENERATED: ${fileName}`)
                console.log(`IMAGE GENERATED: ${fileName}`)
              })
          })
        })
      }) 
      res.sendFile(fileName)
    } catch (err) {
      console.log(err)
      return res.status(500).json({
        message: 'Error generating pictogram. See error field for details',
        error: err
      })
    }
  },

  searchPictograms: async (req, res) => {
    const locale = req.swagger.params.locale.value
    const searchText = stopWords(req.swagger.params.searchText.value, locale)
    console.log(`searchText filtered:  ${searchText}`)
    try {
      let pictograms = await Pictograms[locale]
        .find({ $text: { $search: searchText, $language: 'none', $diacriticSensitive: false } }, {score: {$meta: 'textScore'}})
        .populate('authors')
        .sort({'score': { '$meta': 'textScore'} })
      if (pictograms.length===0) return res.status(404).json([]) 
      return res.json(pictograms)
    } catch (err) {
      console.log(err)
      return res.status(500).json({
        message: 'Error getting pictograms. See error field for detail',
        error: err
      })
    }
  },
  getNewPictograms: async (req, res) => {
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
    } catch(err){
      return res.status(500).json({
        message: 'Error searching pictogram. See error field for detail',
        error: err
      })
    }
  },
  getLastPictograms: async (req, res) => {
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
    } catch(err){
      return res.status(500).json({
        message: 'Error searching pictogram. See error field for detail',
        error: err
      })
    }
  }
}

