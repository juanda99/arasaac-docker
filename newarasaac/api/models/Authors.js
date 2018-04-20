var mongoose = require('mongoose')
var Schema = mongoose.Schema

export const authorSchema = new Schema({
  name: {
    type: String,
    requird: true
  }, 
  email: {
    type: String,
    required: true
  }, 
  url: String,
  company: String,
  idAuthor: Number // autogerated by mongoose-plugin-autoinc
})

const author = mongoose.model('Author', authorSchema)

module.exports = {
  author,
  authorSchema
}
