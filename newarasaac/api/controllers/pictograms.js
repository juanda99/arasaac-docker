const fs = require('fs-extra')
const path = require('path')
const jp = require('jsonpath')
const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
// we load pictos model for all languages
const setPictogramModel = require('../models/Pictograms')
const Category = require('../models/Category')
const stopWords = require('../utils/stopWords')
const { IMAGE_DIR, SVG_DIR, IMAGE_URL } = require('../config')

const languages = require('../utils/languages')
const logger = require('../utils/logger')
const { convertSVG, getPNGFileName, modifySVG } = require('../utils/svg')

const removeDiacritics = require('../utils/removeDiacritics')

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
      { published: 0, validated: 0, available: 0, __v: 0 }
    )
    logger.debug(`Search pictogram with id ${_id} and locale ${locale}`)
    if (!pictogram) {
      logger.debug(`Not found pictogram with id ${_id} and locale ${locale}`)
      return res.status(404).json()
    }
    return res.json(pictogram)
  } catch (err) {
    logger.error(`Error getting pictogram with id ${_id} and locale ${locale}. See error: ${err}`)
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}

const getPictogramByIdWithLocales = async (req, res) => {
  const _id = req.swagger.params.idPictogram.value
  const languages = req.swagger.params.languages.value
  const results = []
  try {
    for (const language of languages) {
      results.push(Pictograms[language].findOne(
        { _id, published: true },
        { published: 0, validated: 0, available: 0, desc: 0, __v: 0 }
      ).lean())
    }
    const pictograms = await Promise.all(results)
    console.log(pictograms[0], 'entra????')
    if (!pictograms[0]) {
      logger.debug(`Not found pictograms with id ${_id} and languages ${languages.join(', ')}`)
      return res.status(404).json({ error: `Not found pictograms with id ${_id} and languages ${languages.join(', ')}` })
    }
    let pictogramData = pictograms[0]
    pictogramData.keywordsByLocale = {}
    let i = 0
    for (const pictogram of pictograms) {
      console.log(pictogram)
      pictogramData.keywordsByLocale[languages[i]] = pictogram.keywords
      i += 1
    }
    logger.debug(`Search pictograms with id ${_id} and languages ${languages.join(', ')}`)
    // eslint-disable-next-line prefer-reflect
    delete pictogramData.keywords
    return res.json(pictogramData)
  } catch (err) {
    logger.error(`Error getting pictogram with id ${_id} and languages ${languages.join(', ')}. See error: ${err}`)
    return res.status(500).json({
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}


const getAllPictograms = async (req, res) => {

  logger.debug(`Get list of all pictograms`)
  const locale = req.swagger.params.locale.value

  try {
    let pictogram = await Pictograms[locale].find(
      { published: true },
      { published: 0, validated: 0, available: 0, desc: 0, __v: 0 }
    )
    if (!pictogram) {
      logger.debug(`No pictograms found`)
      return res.status(404).json({
        error: `No pictograms found`
      })
    }
    logger.debug(`Pictograms found`)
    return res.json(pictogram)
  } catch (err) {
    logger.error(`Error getting pictograms. See error: ${err}`)
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
      // we neeed to get synset for wordnet3.1
      const data = await Synsets.findOne({ [key]: synset }, { id: 1, _id: 0 })
      if (!data) {
        logger.debug(`Synset ${synset} not found for Wordnet ${wordnet} in our data`)
        return res.status(404).json({
          error: `Synset ${synset} not found for Wordnet ${wordnet} in our data`
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
    logger.error(`Error getting pictograms. See error: ${err}`)
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
    logger.error(`Error generating pictogram. See error: ${err}`)
    return res.status(500).json({
      message: 'Error generating pictogram. See error field for details',
      error: err
    })
  }
}

const searchPictograms = async (req, res) => {
  const locale = req.swagger.params.locale.value
  /* without stopwords for searching categories */
  const fullSearchText  = req.swagger.params.searchText.value.toLowerCase()

  const searchText = stopWords(fullSearchText, locale)
  logger.debug(`EXEC searchPictograms with locale ${locale} and searchText ${fullSearchText}`)

  /* primero haremos búsqueda exacta, también con plural, luego busqueda por categoría
  y si no hay nada, por textScore */
  try {
    let pictogramsByKeyword = await Pictograms[locale]
      .find({
        $or: [
          {
            'keywords.keyword': fullSearchText
          },
          {
            'keywords.plural': fullSearchText
          }
        ],
        published: true
      })
      .select({ published: 0, validated: 0, available: 0, desc: 0, __v: 0 })
      .lean()

    const category = await Category.findOne({ locale }, { _id: 0 })
    let pictogramsByCategory = []
    if (category) {
      const nodes = jp.nodes(category.data, '$..keywords');
      const categories = nodes
        .filter(node => node.value.some(keyword => {
          
          if(removeDiacritics(stopWords(keyword, locale)).toLowerCase() === removeDiacritics(searchText)) {
            console.log(node.value, keyword,  searchText)
            return true;
          }
          return  false
        }))
        .map(node=>node.path[node.path.length -2])

      // we get all subcategories from searchText do to the find  in ddbb:  
      if (categories.length) {
        const subCategories = []
        categories.forEach(categoryItem => {
          const partialData = jp.value(category.data, `$..["${categoryItem}"]`)
          const newCategories = getSubcategories(partialData, [categoryItem])
          newCategories.forEach(element => {
            subCategories.push(element)
          });
        })

        // search ddbb:
        pictogramsByCategory = await Pictograms[locale]
          .find({
            categories: { $in: subCategories }, 
            published: true
          })
          .select({ published: 0, validated: 0, available: 0, __v: 0 })
          .lean()
        
        // sort data, first pictos classified in this category or subcategories as first
        // category
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

          /* subcategories later than categories if needed*/
          if (position===0) {
            const aPosition = categories.reduce((accumulator, currentValue)=>{
              const position = a.categories.indexOf(currentValue)
              return position === -1 ? accumulator : Math.min(position, accumulator)
            }, 100)
            const bPosition = categories.reduce((accumulator, currentValue)=>{
              const position = b.categories.indexOf(currentValue)
              return position === -1 ? accumulator : Math.min(position, accumulator)
            }, 100)
          position = aPosition - bPosition
          }

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
            },
            published: true
          },
          { score: { $meta: 'textScore' } }
        )
        .select({ published: 0, validated: 0, available: 0, __v: 0 })

        .lean()
      }

    // pictogramsByText.forEach(pictogram =>
    //   Reflect.deleteProperty(pictogram, 'score'))

    let pictograms = [
      ...pictogramsByKeyword,
      ...pictogramsByCategory,
      ...pictogramsByText
    ]

    // if  no results we try by  phonemes (no more than five letters)
    if (pictograms.length === 0 && fullSearchText.length>1 && fullSearchText.length<6) {

        pictograms = await Pictograms[locale]
          .find(
            {
              $or: [
                {
                  'keywords.keyword': new RegExp(fullSearchText)
                },
                {
                  'keywords.plural': new RegExp(fullSearchText)
                }
              ],
              published: true
            }
          )
          .select({ published: 0, validated: 0, available: 0, __v: 0 })
          .lean()
    }

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


const bestSearchPictograms = async (req, res) => {
  const locale = req.swagger.params.locale.value
  logger.debug(`EXEC searchPictograms with locale ${locale} and searchText ${req.swagger.params.searchText.value}`)

  /* haremos búsqueda exacta */
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
      .select({ published: 0, validated: 0, available: 0, __v: 0 })
      .lean()

    if (pictogramsByKeyword.length === 0) return res.status(404).json([])
    logger.debug(`Found ${pictogramsByKeyword.length} pictograms`)
    return res.json(pictogramsByKeyword)
  } catch (err) {
    logger.error(`Error getting pictograms with locale ${locale} and searchText ${searchText}. See error: ${err}`)
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
    logger.error(`Error getting new pictograms. See error: ${err}`)
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
      .select({ published: 0, validated: 0, available: 0,  __v: 0 })
      // .sort({ lastUpdated: -1 }) modifing a lot, doesn't make sense
      .sort({ created: -1 })
      .limit(numItems)
    if (pictograms.length === 0) {
      logger.info(`No pictograms found for locale ${locale}.`)
      return res.status(404).json([])
    } //send http code 404!!!
    return res.json(pictograms)
  } catch (err) {
    logger.error(`Error getting last {numItems} pictograms for locale ${locale}. See error: ${err}`)
    return res.status(500).json({
      message: 'Error searching pictogram. See error field for detail',
      error: err
    })
  }
}

module.exports = {
  getPictogramById,
  getAllPictograms,
  getPictogramByIdWithLocales,
  getPictogramFileById,
  getPictogramsBySynset,
  searchPictograms,
  bestSearchPictograms,
  getNewPictograms,
  getLastPictograms
}
