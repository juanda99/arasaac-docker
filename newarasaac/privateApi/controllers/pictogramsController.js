const fs = require('fs-extra')
const randomize = require('randomatic')
const filenamify = require('filenamify')
const formidable = require('formidable')
const path = require('path')
const { IMAGE_DIR } = require('../utils/constants')
const setPictogramModel = require('../models/Pictogram')
const stopWords = require('../utils/stopWords')
const languages = require('../utils/languages')

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
      message: 'Error getting pictogram keywords. See error field for detail',
      error: err
    })
  }
}

const getKeywordsById = async (req, res) => {
  const { id, locale } = req.params

  try {
    const pictograms = await Pictograms[locale].findOne(
      {
        idPictogram: id
      },
      { keywords: 1, _id: 0 }
    )
    // TODO: findOne does not return an array, text next line:
    if (pictograms.length === 0) return res.status(404).json([])
    else {
      // const keywords = pictograms.keywords.map((keywordReg) => keywordReg.keyword)
      // return res.status(200).json({keywords})
      return res.status(200).json(pictograms.keywords)
    }
    return res.json(pictograms)
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

module.exports = {
  getPictogramsFromDate,
  getAll,
  getKeywordsById,
  getPictogramsIdBySearch,
  postCustomPictogramFromBase64,
  getCustomPictogramByName,
  getLocutionById
}
