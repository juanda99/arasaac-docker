const Keywords = require('../models/Keyword')
const setPictogramModel = require('../models/Pictogram')
const languages = require('../utils/languages')
const Category = require('../models/Category')
const jp = require('jsonpath')
const CustomError = require('../utils/CustomError')
const logger = require('../utils/logger')

const Pictograms = languages.reduce((dict, language) => {
  dict[language] = setPictogramModel(language)
  return dict
}, {})

const getAll = async (req, res) => {
  logger.debug(`EXEC getAll keywordsController`)

  // we should obtain data just for languages with permissions for translator
  const dataLanguages = req.user.role === 'admin' ? languages : req.user.targetLanguages
  try {
    const keywords = await Keywords.find({}).lean()
    if (!keywords) {
      logger.debug(`Not found keywords`)
      return res.status(404).json({})
    }
    const keywordsResponse = dataLanguages.map(language => {
      const tmpKeyword = keywords.filter(keyword => keyword.language === language)
      return { language, updated: tmpKeyword[0].updated, keywords: tmpKeyword[0].words.length }
    })
    return res.json(keywordsResponse)
  } catch (error) {
    logger.error(
      `Error executing getAll in keywordsController. See error: ${error}`
    )
    return res.status(500).json({
      error: error.message
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

    const category = await Category.findOne({ locale: language }, { _id: 0 })
    let catkeywords = [] 
    if (!category) {
      logger.warn(`No categories found for locale ${locale} we set it empty for keywords generation!`)
    }
    else {
      const keywords = jp.query(category.data, '$..keywords')
      catKeywords = [].concat(...keywords)
    }


    // let merged = [].concat(...words)
    merged = [].concat(...words, ...catKeywords).sort()
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

    const category = await Category.findOne({ locale: language }, { _id: 0 })
    let catkeywords = [] 
    if (!category) {
      logger.warn(`No categories found for locale ${locale} we set it empty for keywords generation!`)
    }
    else {
      const keywords = jp.query(category.data, '$..keywords')
      catKeywords = [].concat(...keywords)
    }



    // let merged = [].concat(...words)
    merged = [].concat(...words, ...catKeywords).sort()
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

module.exports = {
  getAll,
  updateKeywords,
  updateKeywordsByCrontab
}
