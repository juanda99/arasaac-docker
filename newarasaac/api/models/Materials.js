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
  authors: [
    {
      author: { type: Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, default: 'translator' },
      _id: false
    }
  ],
  _id: false
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
  authors: [
    {
      author: { type: Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, default: 'author' },
      _id: false
    }
  ],
  created: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  downloads: Number,
  idMaterial: Number,
  status: { type: Number, default: 2 }, // 0 no published, 1 published, 2 pending
  translations: [translationSchema]
})

const Material = mongoose.model('Material', materialSchema)

module.exports = Material
