const fs = require('fs-extra')
const randomize = require('randomatic')
const sanitize = require('sanitize-filename')
const formidable = require('formidable')
const setPictogramModel = require('../models/Pictogram')
const stopWords = require('../utils/stopWords')

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

const Pictograms = languages.reduce((dict, language) => {
  dict[language] = setPictogramModel(language)
  return dict
}, {})

// similar to getNewPictograms (publicApi) but with time instead of days

const getPictogramsFromDate = async (req, res) => {
  const { lastUpdated, locale } = req.params
  try {
    const pictograms = await Pictograms[locale]
      .find({ lastUpdated: { $gt: new Date(lastUpdated) } })
      .populate('authors')
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
      message: 'Error getting pictograms See error field for detail',
      error: err
    })
  }
}

/* not used, could be for searching in arasaac-admin, but we use public api endpoint */
const getPictogramsIdBySearch = async (req, res) => {
  const { locale, searchText } = req.params
  const filterSearchText = stopWords(searchText, locale)
  console.log(`searchText filtered:  ${searchText}`)
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
      message: 'Error getting pictograms. See error field for detail',
      error: err
    })
  }
}

/*
     Use for downloading custom pictograms made with canvas
*/
const postPictoImageFromBase64 = async (req, res) => {
  let { fileName, base64Data} = req.body
  base64Data = base64Data.replace(/^data:image\/png;base64,/, '')
  const destFileName = `/tmp/${randomize('Aa0', 10)}.png`
  fileName = `${sanitize(fileName) || 'image'}.png`
  try {
    await fs.writeFile(destFileName, base64Data, 'base64')
    res.download(destFileName, fileName)
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      message: 'Error downloading pictogram. See error field for detail',
      error: err
    })
  }
}

module.exports = {
  getPictogramsFromDate,
  getAll,
  getPictogramsIdBySearch,
  postPictoImageFromBase64
}
