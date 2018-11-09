const sharp = require('sharp')
const fs = require('fs-extra')
const path = require('path')
const imagemin = require('imagemin')
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

const getNextLayer = layer => {
  const layers = [
    'Fondo',
    'contorno2',
    'relleno',
    'contorno'
  ]
  const layerIndex = layers.indexOf(layer) +1
  if (layerIndex<4) {
    return `<g id="${layers[layerIndex]}">`
  }
  return '</svg>'
}

const pluralSVGCode = '\n<rect x="390.2" y="147.2" style="fill:#FFFFFF;" width="55" height="55"/>\n<line style="fill:none;stroke:#000000;stroke-width:16.6297;" x1="417.6" y1="149.5" x2="417.6" y2="199.5"/>\n<line style="fill:none;stroke:#000000;stroke-width:16.6297;" x1="392.5" y1="174.7" x2="442.5" y2="174.7"/>'
const futureSVGCode = '\n<rect x="390.2" y="147.2" style="fill:#FFFFFF;" width="55" height="55"/>\n<line style="fill:none;stroke:#000000;stroke-width:12;" x1="393.1" y1="174.7" x2="423.5" y2="174.7"/>\n<polygon points="413,156.9 413,192.1 443,174.5"/>'
const pastSVGCode = '\n<rect x="-55" y="147" style="fill:#FFFFFF;" width="55" height="55"/>\n<line style="fill:none;stroke:#000000;stroke-width:12;" x1="-33.5" y1="174.7" x2="-3.1" y2="174.7"/>\n<polygon points="-53,174.5 -23,192.1 -23,156.9"/>'
const skin = {
  white: '#F5E5DE',
  black: '#A65C17',
  assian: '#F4ECAD',
  mulatto: '#E3AB72',
  aztec: '#CF9D7C',
  schematic: '#FEFEFE'
}
const hair = {
  brown: '#A65E26',
  blonde: '#FDD700',
  red: '#F04A23',
  black: '#020100',
  gray: '#EFEFEF',
  darkGray: '#AAABAB',
  darkBrown: '#6A2703'
}


/*
const modifySVG = (fileContent, layer, layerText) => {
  const startAt = `<g id="${layer}">`
  const finishAt = getNextLayer(layer)
  let s = fileContent.indexOf(startAt)
  let f = fileContent.indexOf(finishAt)
  return `${fileContent.substr(0, s)}<g id="${layer}">${layerText}</g>\n${fileContent.substr(f)}`
}
*/

// const getPNGFileName = (file, resolution) => path.resolve(IMAGE_DIR, `${path.basename(file, '.svg')}_${resolution}.png` )

const getPNGFileName = async (file, options ) => {
  const { plural, color, backgroundColor, action, resolution, hair, skin } = options
  const idFile = path.basename(file, '.svg')
  let fileName = idFile
  if (plural) fileName = `${fileName}-plural`
  if (!color) fileName = `${fileName}-nocolor`
  if (backgroundColor) fileName = `${fileName}-backgroundColor=${backgroundColor}`
  if (action !== 'present') fileName = `${fileName}-action=${action}`
  if (resolution !== 500) fileName = `${fileName}-resolution=${resolution}`
  if (hair) fileName = `${fileName}-hair=${hair}`
  if (skin) fileName = `${fileName}-skin=${skin}`
  
  await fs.ensureDir(path.resolve(IMAGE_DIR, idFile))
  return path.resolve(IMAGE_DIR, idFile, `${fileName}.png` )
}

const modifyLayer = (fileContent, layer, layerText) => {
  const startAt = `<g id="${layer}">`
  const finishAt = getNextLayer(layer)
  let s = fileContent.indexOf(startAt)
  let f = fileContent.indexOf(finishAt)
  return `${fileContent.substr(0, s)}<g id="${layer}">${layerText}</g>\n${fileContent.substr(f)}`
}

const addLayer = (fileContent, layer, layerText) => {
  let s = fileContent.indexOf('</svg>')
  return `${fileContent.substr(0, s)}<g id="${layer}">${layerText}</g>\n</svg>`
}

const skinsToRemove = `${skin.white}|${skin.schematic}`
const reSkin = new RegExp(skinsToRemove, 'gim')
const modifySkin = (fileContent, key) => fileContent.replace(reSkin, skin[key])

const hairToRemove = () => {
  let value=''
  Object.keys(hair).forEach(function(key) {
    value += `${hair[key]}|` 
  })
  return value.slice(0, -1) 
}
const reHair = new RegExp(hairToRemove(), 'gim')
const modifyHair = (fileContent, key) => fileContent.replace(reHair, hair[key])

const modifySVG = ( fileContent, options ) => {
  let content = fileContent
  const { plural, color, backgroundColor, action, hair, skin } = options
  if (plural) content = addLayer(content, 'plural', pluralSVGCode)
  if (backgroundColor) content = modifyLayer(content, 'Fondo', `<rect x="-54" y="147" style="fill:${backgroundColor};" width="500" height="500"/>`)
  if (!color) content = modifyLayer(content, 'relleno', '')
  if (action==='future') content = addLayer (content, 'action', futureSVGCode)
  else if (action==='past') content = addLayer (content, 'action', pastSVGCode)
  if (hair) content = modifyHair(content, hair)
  if (skin) content = modifySkin(content, skin)
  /* eslint-enable no-param-reassign */
  return content
}

const convertSVG = (fileContent, resolution) => {
  // density 450p is for 3125x image
  const density = parseInt(0.144 * resolution, 10)
  const fileBuffer = Buffer.from(fileContent)
  return sharp(fileBuffer, {density}).png().toBuffer()
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
    console.log(req.swagger.params)
    /* eslint-disable multiline-ternary */
    const url = (req.swagger.params.url.value === true)
    const options = {
      plural: req.swagger.params.plural.value || false,
      color: (req.swagger.params.color.value === false) ? req.swagger.params.color.value : true,
      backgroundColor: req.swagger.params.backgroundColor.value || false,
      action: req.swagger.params.action.value || 'present',
      resolution: req.swagger.params.resolution.value || 500,
      skin: req.swagger.params.skin.value || false,
      hair: req.swagger.params.hair.value || false
    }
    /* eslint-enable multiline-ternary */
    try {
      const fileName = await getPNGFileName(file, options)
      const exists = await fs.pathExists(file)
      if (exists) res.sendFile(fileName) 


      const svgContent = await fs.readFile(path.resolve(SVG_DIR, file), 'utf-8')
      // let newSVGContent = modifySVG(svgContent, layer, layerContent )
      let newSVGContent = modifySVG(svgContent, options )
      convertSVG(newSVGContent, options.resolution)
        .then (buffer => imagemin.buffer(buffer, {
          plugins: [imageminPngquant({quality: '65-80', speed: 10})]
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
                // logger.info(`IMAGE GENERATED: ${fileName}`)
                console.log(`IMAGE GENERATED: ${fileName}`)
                if (url) res.json({image: fileName.replace(IMAGE_DIR, 'https://static.arasaac.org/pictograms')})
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

