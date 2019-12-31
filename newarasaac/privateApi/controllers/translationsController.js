const axios = require('axios')
const { CROWDIN_ARASAAC_API_KEY, CROWDIN_ADMIN_ARASAAC_API_KEY } = process.env
const qs = require('qs')
const languages = require('../utils/languages')
const setPictogramModel = require('../models/Pictogram')

const Pictograms = languages.reduce((dict, language) => {
  dict[language] = setPictogramModel(language)
  return dict
}, {})

const getTranslationStatus = async (req, res) => {
  const { language } = req.params

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

    const getPictogramsTranslated = Pictograms[language]
      .find({ available: true, validated: true })
      .countDocuments()
      .exec()

    const [
      arasaacCrowdin,
      adminArasaacCrowdin,
      totalPictograms,
      pictogramsTranslated
    ] = await Promise.all([
      getArasaacCrowdin,
      getAdminArasaacCrowdin,
      getTotalPictograms,
      getPictogramsTranslated
    ])

    const arasaacPhrases = arasaacCrowdin.data.files[0].phrases
    const arasaacTranslated = arasaacCrowdin.data.files[0].translated
    const arasaacPhrases2 = adminArasaacCrowdin.data.files[0].phrases
    const arasaacTranslated2 = adminArasaacCrowdin.data.files[0].translated

    return res.status(200).json({
      totalPictograms,
      pictogramsTranslated,
      arasaacPhrases,
      arasaacTranslated,
      arasaacPhrases2,
      arasaacTranslated2
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      error: error.message
    })
  }
}

module.exports = {
  getTranslationStatus
}
