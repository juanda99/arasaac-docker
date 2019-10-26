const mongoose = require('mongoose')
const { Schema } = mongoose

const verbSchema = new Schema({
  language: {
    type: String,
    required: true
  },
  verb: {
    type: String,
    required: true
  },
  present: {
    type: [String],
    required: true
  },
  past: {
    type: [String],
    required: true
  },
  future: {
    type: [String],
    required: true
  }
})

const Verb = mongoose.model('Verb', verbSchema)

module.exports = Verb
