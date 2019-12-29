var mongoose = require('mongoose')
var Schema = mongoose.Schema

var keywordSchema = new Schema({
  language: String,
  words: [String],
  lastUpdated: { type: Date, default: Date.now }
})

var Keyword = mongoose.model('Keyword', keywordSchema, 'keywords')

module.exports = Keyword
