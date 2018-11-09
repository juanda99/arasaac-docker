// const User = require('../models/words')
const { getVerbixConjugations } = require('./utils')
const { NO_VERB_CONJUGATION_AVAILABLE } = require('./constants')

module.exports = {
  getConjugations: async (req, res) => {
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
}
