// const User = require('../models/words')
const {
  getVerbixConjugations,
  getDeclinations,
  readConjugations,
  saveConjugations
} = require('./utils')
const { NO_VERB_CONJUGATION_AVAILABLE } = require('./constants')
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
    console.log(`Conjugations: ${conjugations}`)
    if (!conjugations) {
      found = false
      conjugations = await getVerbixConjugations(language, word)
    }
    if (!found) saveConjugations(language, word, conjugations)
    return res.status(200).json(conjugations)
  } catch (err) {
    if (err.message === NO_VERB_CONJUGATION_AVAILABLE) {
      return res.status(404).json({
        message,
        error: `${NO_VERB_CONJUGATION_AVAILABLE} ${language}`
      })
    }
    return res.status(500).json({
      message,
      error: err.message
    })
  }
}

// TODO updateConjugations, now just a copy of getConjugations!!!
const updateConjugations = async (req, res) => {
  const message = 'Error updating conjugations'
  const { word, language } = req.params

  try {
    // getConjugations from local, if not exists, get from Verbix and save locally before sending
    let found = true
    let conjugations = await readConjugations(language, word)
    console.log(`Conjugations: ${conjugations}`)
    if (!conjugations) {
      found = false
      conjugations = await getVerbixConjugations(language, word)
    }
    if (!found) saveConjugations(language, word, conjugations)
    return res.status(200).json(conjugations)
  } catch (err) {
    if (err.message === NO_VERB_CONJUGATION_AVAILABLE) {
      return res.status(404).json({
        message,
        error: `${NO_VERB_CONJUGATION_AVAILABLE} ${language}`
      })
    }
    return res.status(500).json({
      message,
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
