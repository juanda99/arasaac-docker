const mongoose = require('mongoose')
const Schema = mongoose.Schema

const materialSchema = new Schema({
  title: String
})

const Material = mongoose.model('Material', materialSchema)

module.exports = Material
