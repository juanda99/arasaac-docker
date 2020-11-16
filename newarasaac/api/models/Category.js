const mongoose = require('mongoose')
const { Schema } = mongoose

const CategorySchema = new Schema({
  locale: { type: String, unique: true, required: true },
  lastUpdated: { type: Date, default: Date.now },
  data: {
    type: Object,
    required: true
  }
})
const Category = mongoose.model('Category', CategorySchema, 'categories')

module.exports = Category
