"use strict";

var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var synsetSchema = new Schema({
  id: String,
  old_keys: Object
});
var Synset = mongoose.model('Synset', synsetSchema, 'synsets');
module.exports = Synset;