
// we load pictos model for all languages

const setPictogramModel = require('../models/Pictograms')
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
  getPictogramById: (req, res) => {
    const id = req.swagger.params.idPictogram.value
    const locale = req.swagger.params.locale.value
    // Use lean to get a plain JS object to modify it, instead of a full model instance
    Pictograms[locale].findOne({id_image: id}).exec( (err, pictogram) => {
      if(err) {
        return res.status(500).json({
          message: 'Error getting pictograms. See error field for detail',
          error: err
        })
      }
      if(!pictogram) {
        return res.status(404).json( {
          message: `Error getting pictogram with id ${id}`,
          err
        })
      }
      return res.json(pictogram)
    })
  },
  searchPictograms: (req, res) => {
    var locale = req.swagger.params.locale.value
    var searchText = req.swagger.params.searchText.value
    Pictograms[locale]
      .find({ $text: { $search: searchText, $language: locale, $diacriticSensitive: false } }, {score: {$meta: 'textScore'}})
      .sort({'score': { '$meta': 'textScore'} })
      .lean()
      .exec ((err, pictograms) => {
        if(err) {
          return res.status(500).json({
            message: 'Error getting pictograms. See error field for detail',
            error: err
          })
        } 
        // if no items, return empty array
        if (pictograms.length===0) return res.status(404).json([]) //send http code 404!!!
        return res.json(pictograms)
      })
  },
  getNewPictograms: (req, res) => {
    let days = req.swagger.params.days.value
    var locale = req.swagger.params.locale.value
    let startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    Pictograms[locale]
      .find({ lastUpdate: { $gt: startDate } })
      .sort({ lastUpdate: -1 })
      .lean()
      .exec((err, pictograms) => {
        if (err) {
          return res.status(500).json({
            message: 'Error buscando el material',
            error: err
          })
        }
        // if no items, return empty array
        if (pictograms.length === 0) return res.status(404).json([]) //send http code 404!!!
        return res.json(pictograms)
      })
  },
  getLastPictograms: (req, res) => {
    const numItems = req.swagger.params.numItems.value
    var locale = req.swagger.params.locale.value
    Pictograms[locale]
      .find()
      .sort({ lastUpdate: -1 })
      .limit(numItems)
      .lean()
      .exec((err, pictograms) => {
        if (err) {
          return res.status(500).json({
            message: 'Error buscando el material',
            error: err
          })
        }
        // if no items, return empty array
        if (pictograms.length === 0) return res.status(404).json([]) //send http code 404!!!
        return res.json(pictograms)
      })
  }
}

