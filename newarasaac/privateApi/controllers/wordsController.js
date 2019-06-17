const logger = require('../utils/logger')
const Verb = require('../models/Verb')
const {
  getVerbixConjugations,
  getDeclinations,
  readConjugations,
  saveConjugations
} = require('./utils')
const { PAST, PRESENT, FUTURE } = require('./constants')
const axios = require('axios')
const setPictogramModel = require('../models/Pictogram')
const languages = require('../utils/languages')

const Pictograms = languages.reduce((dict, language) => {
  dict[language] = setPictogramModel(language)
  return dict
}, {})

const getConjugations = async (req, res) => {
  const message = 'Error getting conjugations'
  const { word, language } = req.params

  try {
    // getConjugations from local, if not exists, get from Verbix and save locally before sending
    let found = true
    let conjugations = await readConjugations(language, word)
    if (!conjugations) {
      found = false
      conjugations = await getVerbixConjugations(language, word)
    }
    if (!found) saveConjugations(language, word, conjugations)
    const present = getDeclinations(PRESENT, conjugations)
    const past = getDeclinations(PAST, conjugations)
    const future = getDeclinations(FUTURE, conjugations)
    await Verb.findOneAndUpdate(
      { language, verb: word },
      { present, past, future, verb: word, language },
      { upsert: true }
    )

    return res.status(200).json(conjugations)
  } catch (err) {
    logger.error(`Error getting conjugations: ${err.message}`)
    return res.status(err.httpCode || 500).json({
      message: 'Error getting conjugations. See error field for detail',
      error: err.message
    })
  }
}

const updateKeywords = async (req, res) => {
  const { locale } = req.params
  try {
    const pictograms = await Pictograms[locale]
      .find({}, { 'keywords.keyword': 1, 'keyword.plural': 1, _id: 0 })
      .lean()
    if (pictograms.length === 0) return res.json([]) //
    const keywords = pictograms.map(pictogram =>
      pictogram.keywords.map(keyword => {
        const keywords = []
        if (keyword.keyword) keywords.push(keyword.keyword)
        if (keyword.plural) keywords.push(keyword.plural)
        return keywords
      })
    )
    let merged = [].concat(...keywords)
    merged = [].concat(...merged).sort()
    // remove duplicates
    merged = [...new Set(merged)]
    const data = {
      locale,
      keywords: merged,
      updated: new Date()
    }
    return res.json(data)
  } catch (err) {
    return res.status(500).json({
      message: 'Error getting keywords',
      error: err
    })
  }
}

const getWordnetById = async (req, res) => {
  const { idSynset } = req.params
  const url = `http://wordnet-rdf.princeton.edu/json/id/${idSynset}`
  console.log(url)
  try {
    const response = await axios.get(url)
    if (response.data === 'Synset Not Found') throw Error('Synset not found')
    return res.status(200).json(response.data)
  } catch (err) {
    return res.status(404).json({ message: err.message })
  }
}

module.exports = {
  getConjugations,
  getWordnetById,
  updateKeywords
}
