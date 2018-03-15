var mongoose = require('mongoose')
var Schema = mongoose.Schema

var pictogramSchema = new Schema({
  Nombre: String, 
  Descripción: String, 
  Graduacion: String,
  Envase: String,
  Precio: String 
})

var Pictogram = mongoose.model('Pictogram', pictogramSchema, 'pictograms')

module.exports = Pictogram
