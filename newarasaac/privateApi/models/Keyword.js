const mongoose = require('mongoose')
const Schema = mongoose.Schema

const keywordSchema = new Schema({
  language: String,
  words: [String],
  updated: { type: Date, default: Date.now }
})

const Keyword = mongoose.model('Keyword', keywordSchema, 'keywords')

module.exports = Keyword
