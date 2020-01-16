const axios = require('axios')
const { CROWDIN_ARASAAC_API_KEY, CROWDIN_ADMIN_ARASAAC_API_KEY } = process.env
const qs = require('qs')
const Translations = require('../models/Translation')
// const CustomError = require('../utils/CustomError')
const logger = require('../utils/logger')
const languages = require('../utils/languages')
const setPictogramModel = require('../models/Pictogram')

const Pictograms = languages.reduce((dict, language) => {
  dict[language] = setPictogramModel(language)
  return dict
}, {})

const postTranslationStatus = async (req, res) => {
  const { language } = req.params
  logger.debug(
    `EXEC postTranslationsStatus for language ${language}`
  )

  try {
    const config = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
    let crowdinLanguage
    switch (language) {
      case 'es':
        crowdinLanguage = 'es-ES'
        break
      case 'val':
        crowdinLanguage = 'val-ES'
        break
      case 'zh':
        crowdinLanguage = 'zh-CN'
        break
      case 'pt':
        crowdinLanguage = 'pt-PT'
        break
      case 'br':
        crowdinLanguage = 'pt-BR'
        break
      default:
        crowdinLanguage = language
    }

    const getArasaacCrowdin = axios.post(
      `https://api.crowdin.com/api/project/arasaac/language-status?key=${CROWDIN_ARASAAC_API_KEY}`,
      qs.stringify({ language: crowdinLanguage, json: '' }),
      config
    )

    const getAdminArasaacCrowdin = axios.post(
      `https://api.crowdin.com/api/project/arasaac-management/language-status?key=${CROWDIN_ADMIN_ARASAAC_API_KEY}`,
      qs.stringify({ language: crowdinLanguage, json: '' }),
      config
    )

    const getTotalPictograms = Pictograms[language]
      .find({ available: true })
      .countDocuments()
      .exec()

    const getPictogramsValidated = Pictograms[language]
      .find({ available: true, validated: true })
      .countDocuments()
      .exec()

    const [
      arasaacCrowdin,
      adminArasaacCrowdin,
      totalPictograms,
      pictogramsValidated
    ] = await Promise.all([
      getArasaacCrowdin,
      getAdminArasaacCrowdin,
      getTotalPictograms,
      getPictogramsValidated
    ])

    const arasaacPhrases = arasaacCrowdin.data.files[0].phrases
    const arasaacTranslated = arasaacCrowdin.data.files[0].translated
    const adminPhrases = adminArasaacCrowdin.data.files[0].phrases
    const adminTranslated = adminArasaacCrowdin.data.files[0].translated
    const updated = Date.now()
    await Translations.findOneAndUpdate(
      { language },
      { language, arasaacPhrases, arasaacTranslated, adminPhrases, adminTranslated, totalPictograms, pictogramsValidated, updated },
      { upsert: true }
    )

    logger.debug(`DONE postTranslationStatus for language ${language}.`)

    return res.status(200).json({
      totalPictograms,
      pictogramsValidated,
      arasaacPhrases,
      arasaacTranslated,
      adminPhrases,
      adminTranslated,
      updated
    })
  } catch (error) {
    logger.error(
      `Error executing postTranslationStatus for language ${language}. See error: ${error}`
    )
    return res.status(500).json({
      error: error.message
    })
  }
}

const getTranslationStatus = async (req, res) => {
  const { language } = req.params
  logger.debug(
    `EXEC getTranslationStatus for language ${language}`
  )

  try {
    const translation = await Translations.findOne({ language }, { __v: 0 })
    if (!translation) {
      logger.debug(`Not found translation for language ${language}`)
      return res.status(404).json({})
    }
    return res.json(translation)
  } catch (error) {
    logger.error(
      `Error getting translationStatus for language ${language}. See error: ${error}`
    )
    return res.status(500).json({
      error: error.message
    })
  }
}

module.exports = {
  postTranslationStatus,
  getTranslationStatus
}
