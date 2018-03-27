const mongoose = require('mongoose')
const { Schema } = mongoose

const authorSchema = new Schema({
  id: Number,
  name: String
})
const translationSchema = new Schema({
  created: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  title: String,
  desc: String,
  lang: String,
  language: String,
  status: Number
})

const materialSchema = new Schema({
  activity: {
    type: [Number],
    required: true
  },
  area: {
    type: [Number],
    required: true
  },
  authors: [authorSchema],
  created: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  title: String,
  desc: String,
  downloads: Number,
  idMaterial: Number,
  lang: String,
  language: String,
  status: Number,
  translations: [translationSchema]
})

const Material = mongoose.model('Material', materialSchema)

module.exports = Material
