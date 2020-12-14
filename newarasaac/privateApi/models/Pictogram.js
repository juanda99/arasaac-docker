const mongoose = require('mongoose')
const { Schema } = mongoose

const keywordSchema = mongoose.Schema(
  {
    keyword: {
      type: String,
      required: true
    },
    plural: String,
    hasLocution: Boolean,
    meaning: String,
    type: {
      type: Number
    }
    // 1-Proper Names
    // 2-Common names
    // 3-Verbs
    // 4-Descriptives (adj and adv)
    // 5-Social content
    // 6-Miscellaneous
  },
  { _id: false }
)

const pictogramSchema = new Schema({
  _id: Number,
  keywords: [keywordSchema],
  // status: Number, // published (1), unpublished (0)
  published: {
    type: Boolean,
    default: false
  }, // published (1), unpublished (0)
  validated: {
    type: Boolean,
    default: false
  },
  available: {
    type: Boolean,
    default: false
  },
  schematic: {
    type: Boolean,
    default: false
  },
  sex: {
    type: Boolean,
    default: false
  },
  violence: {
    type: Boolean,
    default: false
  },
  aac: {
    type: Boolean,
    default: false
  },
  aacColor: {
    type: Boolean,
    default: false
  },
  skin: {
    type: Boolean,
    default: false
  },
  hair: {
    type: Boolean,
    default: false
  },
  created: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  downloads: {
    type: Number,
    default: 0
  },
  categories: [String],
  synsets: [String],
  tags: [String],
  desc: String // add by language, used by keyword index
})

module.exports = locale =>
  mongoose.model('Pictogram', pictogramSchema, `pictos_${locale}`)
