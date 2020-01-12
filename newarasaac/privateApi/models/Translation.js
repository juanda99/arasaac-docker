const mongoose = require('mongoose')
const Schema = mongoose.Schema

const translationSchema = new Schema({
  language: String,
  totalPictograms: Number,
  pictogramsValidated: Number,
  arasaacPhrases: Number,
  arasaacTranslated: Number,
  adminPhrases: Number,
  adminTranslated: Number,
  updated: { type: Date, default: Date.now }
})

const Translation = mongoose.model('Translation', translationSchema, 'translations')

module.exports = Translation
