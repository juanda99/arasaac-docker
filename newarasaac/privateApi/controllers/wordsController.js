const logger = require('../utils/logger')
const Verb = require('../models/Verb')
const Keywords = require('../models/Keyword')
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

const { CROWDIN_ARASAAC_API_KEY, CROWDIN_ADMIN_ARASAAC_API_KEY } = process.env

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

const updateKeywords = async (req, res) => {
  const { language } = req.params
  logger.debug(`EXEC updateKeywords for language  ${language}`)
  try {
    const pictograms = await Pictograms[language]
      .find({}, { 'keywords.keyword': 1, _id: 0 })
      .lean()

    const words = []
    if (pictograms.length !== 0) {
      for (const pictogram of pictograms) {
        for (const keyword of pictogram.keywords) {
          if (keyword.keyword) {
            words.push(keyword.keyword)
          }
        }
      }
    }

    let merged = [].concat(...words)
    merged = [].concat(...merged).sort()
    // remove duplicates
    merged = [...new Set(merged)]

    // now we compare it to saved data, and update if necessary:
    const keywords = await Keywords.findOne(
      { language },
      { words: 1, _id: 0 }
    ).lean()
    const oldKeywords = keywords ? keywords.words : []
    if (JSON.stringify(merged) !== JSON.stringify(oldKeywords)) {
      logger.debug(`Keywords are new, updating for language  ${language}`)
      const data = {
        language,
        words: merged,
        updated: new Date()
      }
      const updateKeywords = await Keywords.findOneAndUpdate(
        { language },
        { $set: data },
        {
          new: true,
          upsert: true
        }
      )
      if (updateKeywords) {
        logger.debug(`DONE updated keywords for language  ${language}`)
        return res
          .status(200)
          .json({ msg: `DONE updated keywords for language  ${language}` })
      } else {
        logger.error(`FAILED updating keywords for language  ${language}`)
        return res
          .status(500)
          .json({ msg: `FAILED updating keywords for language  ${language}` })
      }
    }
    return res.status(200).json({
      msg: `DONE but not need to update keywords for language  ${language}`
    })
  } catch (err) {
    logger.error(
      `FAILED updating keywords for language  ${language}: ${err.message}`
    )
    return res.status(500).json({
      msg: `FAILED updating keywords for language  ${language}: ${err.msg}`
    })
  }
}

const updateKeywordsByCrontab = async language => {
  logger.debug(`EXEC updateKeywords for language  ${language}`)
  try {
    const pictograms = await Pictograms[language]
      .find({}, { 'keywords.keyword': 1, _id: 0 })
      .lean()
    const words = []
    if (pictograms.length !== 0) {
      for (const pictogram of pictograms) {
        for (const keyword of pictogram.keywords) {
          if (keyword.keyword) {
            words.push(keyword.keyword)
          }
        }
      }
    }

    let merged = [].concat(...words)
    merged = [].concat(...merged).sort()
    // remove duplicates
    merged = [...new Set(merged)]

    // now we compare it to saved data, and update if necessary:
    const keywords = await Keywords.findOne(
      { language },
      { words: 1, _id: 0 }
    ).lean()
    const oldKeywords = keywords ? keywords.words : []
    if (JSON.stringify(merged) !== JSON.stringify(oldKeywords)) {
      logger.debug(`Keywords are new, updating for language  ${language}`)
      const data = {
        language,
        words: merged,
        updated: new Date()
      }
      const updateKeywords = await Keywords.findOneAndUpdate(
        { language },
        { $set: data },
        {
          new: true,
          upsert: true
        }
      )
      if (updateKeywords) {
        logger.debug(`DONE updated keywords for language  ${language}`)
        return true
      } else {
        logger.error(`FAILED updating keywords for language  ${language}`)
        return false
      }
    }
    logger.debug(
      `DONE but not need to update keywords for language  ${language}`
    )
    return true
  } catch (err) {
    logger.error(
      `FAILED updating keywords for language  ${language}: ${err.message}`
    )
    return false
  }
}

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
  getWordnetById,
  updateKeywords,
  updateKeywordsByCrontab
}
