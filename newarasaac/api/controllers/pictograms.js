
// we load pictos model for all languages
const setPictogramModel = require('../models/Pictograms')
const stopWords = require('../utils/stopWords')
const languages = [
  'es',
  'ru',
  'ro',
  'ara', // instead of ar
  'zhs', // instead of zh, zhs simplified chineese zht traditional chineese
  'bg', // not available
  'pl', // not available
  'en',
  'fr',
  'ca', // not available
  'eu', // not available
  'de',
  'it',
  'pt',
  'ga', // not available
  'br', // not available, should we use pt?
  'cr', // not available
  'val' // not available
]

const Pictograms = languages.reduce((dict, language)=> {
  dict[language]= setPictogramModel(language)
  return dict
}, {})

module.exports = {
  getPictogramById: async (req, res) => {
    const id = req.swagger.params.idPictogram.value
    const locale = req.swagger.params.locale.value
    try{
      let pictogram = await Pictograms[locale]
        .findOne({idPictogram: id})
        .populate('authors')
      if(!pictogram) return res.status(404).json()
      return res.json(pictogram)
    } catch(err){
      return res.status(500).json({
        message: 'Error getting pictograms. See error field for detail',
        error: err
      })
    }
  },

  searchPictograms: async (req, res) => {
    const locale = req.swagger.params.locale.value
    const searchText = stopWords(req.swagger.params.searchText.value, locale)
    console.log(`searchText filtered:  ${searchText}`)
    try {
      let pictograms = await Pictograms[locale]
        .find({ $text: { $search: searchText, $language: 'none', $diacriticSensitive: false } }, {score: {$meta: 'textScore'}})
        .populate('authors')
        .sort({'score': { '$meta': 'textScore'} })
      if (pictograms.length===0) return res.status(404).json([]) 
      return res.json(pictograms)
    } catch (err) {
      console.log(err)
      return res.status(500).json({
        message: 'Error getting pictograms. See error field for detail',
        error: err
      })
    }
  },
  getNewPictograms: async (req, res) => {
    let days = req.swagger.params.days.value
    var locale = req.swagger.params.locale.value
    let startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    try {
      let pictograms = await Pictograms[locale]
        .find({ lastUpdate: { $gt: startDate } })
        .sort({ lastUpdate: -1 })
        .populate('authors')
      if (pictograms.length === 0) return res.status(404).json([]) //send http code 404!!!
      return res.json(pictograms)
    } catch(err){
      return res.status(500).json({
        message: 'Error searching pictogram. See error field for detail',
        error: err
      })
    }
  },
  getLastPictograms: async (req, res) => {
    const numItems = req.swagger.params.numItems.value
    var locale = req.swagger.params.locale.value
    try {
      let pictograms = await Pictograms[locale]
        .find()
        .sort({ lastUpdate: -1 })
        .limit(numItems)
        .populate('authors')
      if (pictograms.length === 0) return res.status(404).json([]) //send http code 404!!!
      return res.json(pictograms)
    } catch(err){
      return res.status(500).json({
        message: 'Error searching pictogram. See error field for detail',
        error: err
      })
    }
  }
}

