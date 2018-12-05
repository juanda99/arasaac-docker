const mongoose = require('mongoose')
const mongoosePluginAutoinc = require('mongoose-plugin-autoinc')
const { autoIncrement } = mongoosePluginAutoinc
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
  activities: {
    type: [Number],
    required: true
  },
  areas: {
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

materialSchema.plugin(autoIncrement, {
  model: 'Material',
  field: 'idMaterial',
  startAt: 1709,
  incrementBy: 1
})
const Material = mongoose.model('Material', materialSchema)

module.exports = Material
