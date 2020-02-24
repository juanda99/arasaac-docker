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
  validated: { type: Boolean, default: true },
  authors: [{ type: Schema.Types.ObjectId, ref: 'User' }]
})

// status: 0 no published, 1 published, 2 need review

const materialSchema = new Schema({
  activities: {
    type: [Number],
    required: true
  },
  areas: {
    type: [Number],
    required: true
  },
  authors: [{
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, default: 'author' }
  }],
  created: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  downloads: Number,
  idMaterial: Number,
  status: Number,
  translations: [translationSchema],
  published: { type: Boolean, default: false },
  validated: { type: Boolean, default: false }
})

const Material = mongoose.model('Material', materialSchema)

module.exports = Material
