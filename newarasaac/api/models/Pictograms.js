var mongoose = require('mongoose')
var Schema = mongoose.Schema
let authorSchema = require('./Authors').authorSchema

const  pictogramSchema = new Schema({
  idPictogram: Number, // autogerated by mongoose-plugin-autoinc
  keywords: [
    {
      idKeyword: Number, //for legacy purposes, not used
      keyword: {
        type: String,
        required: true
      },
      locution: Number,
      meaning: String,
      type: {
        type: String,
        required: true,
        enum: [
          'Proper Names',
          'Common names',
          'Verbs',
          'Descriptives (adj and adv)',
          'Social content',
          'Miscellaneous'
        ]
      },
      lse: Number,
      downloads: {
        type: Number,
        default: 0
      },
      sinonyms: [String]
    }
  ],
  authors: [authorSchema],
  status: Number, // published (1), unpublished (0)
  created: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  license: {
    type: String,
    enum: ['Creative Commons BY-NC-SA'], //just one license right now
    default: 'Creative Commons BY-NC-SA'
  },
  downloads: {
    type: Number,
    default: 0
  },
  tags: [String],
  legacyTags: [String], // old tags just in case,
  type: { // from tipo_pictograma, 1 descriptivos, 2 esquemáticos
    type: Number,
    min: 1,
    max: 2,
    default: 1
  }
})

module.exports = locale => {
  return mongoose.model('Pictogram', pictogramSchema, `picto-${locale}`)
} 



