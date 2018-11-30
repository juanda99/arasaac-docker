// const User = require('../models/words')
const { getVerbixConjugations } = require('./utils')
const { NO_VERB_CONJUGATION_AVAILABLE } = require('./constants')
const axios = require('axios')

const getConjugations = async (req, res) => {
  const message = 'Error getting conjugations'
  const { word, language } = req.params
  try {
    // getConjugations from local, if not exists, get from Verbix and save locally before sending
    const resultado = await getVerbixConjugations(language, word)
    return res.status(200).json(resultado)
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
  getWordnetById
}
