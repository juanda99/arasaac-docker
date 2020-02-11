const mongoose = require('mongoose')
const { Schema } = mongoose

// need it for populate!
// eslint-disable-next-line no-unused-vars
const User = require('./User')

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
  activities: {
    type: [Number],
    required: true
  },
  areas: {
    type: [Number],
    required: true
  },
  authors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
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
