const mongoose = require('mongoose')
const { Schema } = mongoose
const pictogramSchema = new Schema({
  idPictogram: Number, // autogerated by mongoose-plugin-autoinc
  keywords: [
    {
      idKeyword: Number, // for legacy purposes, not used
      keyword: {
        type: String,
        required: true
      },
      locution: Number,
      meaning: String,
      type: Number,
      lse: Number,
      downloads: {
        type: Number,
        default: 0
      },
      sinonyms: [String]
    }
  ],
  // status: Number, // published (1), unpublished (0)
  published: {
    type: Boolean,
    default: false
  }, // published (1), unpublished (0)
  validated: {
    type: Boolean,
    default: false
  },
  visible: {
    type: Boolean,
    default: false
  },
  created: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  downloads: {
    type: Number,
    default: 0
  },
  tags: [String],
  searchTags: [String], // add by language, used by keyword index
  legacyTags: [String], // old tags just in case,
  type: {
    // from tipo_pictograma, 1 descriptivos, 2 esquemáticos
    type: Number,
    min: 1,
    max: 2,
    default: 1
  }
})

module.exports = locale =>
  mongoose.model('Pictogram', pictogramSchema, `pictos_${locale}`)
