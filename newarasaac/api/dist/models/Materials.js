"use strict";

var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var materialSchema = new Schema({
  Nombre: String,
  Descripción: String,
  Graduacion: String,
  Envase: String,
  Precio: String
});
var Material = mongoose.model('Material', materialSchema, 'materials');
module.exports = Material;