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

const getConjugations = async (req, res) => {
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
    let present = getDeclinations(PRESENT, conjugations)

    // in spanish we remove negative and add reflexive
    if (language === 'es') {
      present = present.filter(word => word.indexOf('no ') !== 0)
      const reflexive = ['me', 'te', 'se', 'nos', 'os', 'se']
      const infinitive = present[0]
      const gerund = present[1]
      reflexive.forEach(pronoun => {
        present.push(`${infinitive}${pronoun}`)
        present.push(`${gerund}${pronoun}`)
      })
    }
    let past = getDeclinations(PAST, conjugations)
    let future = getDeclinations(FUTURE, conjugations)

    // remove duplicates
    present = [...new Set(present)]
    past = [...new Set(past)]
    future = [...new Set(future)]

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

// TODO: check if this is working ?????
const getWordnetById = async (req, res) => {
  const { idSynset } = req.params
  const url = `http://wordnet-rdf.princeton.edu/json/id/${idSynset}`
  try {
    const response = await axios({
      method: 'post',
      url: `https://api.crowdin.com/api/project/arasaac/language-status?key=63a6c0cbffcc28b98de4ef26b0296f23`,
      data: {
        firstName: 'Fred',
        lastName: 'Flintstone'
      }
    })
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
