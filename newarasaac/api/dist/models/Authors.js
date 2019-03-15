"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.authorSchema = void 0;

var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var authorSchema = new Schema({
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

});
exports.authorSchema = authorSchema;
var author = mongoose.model('Author', authorSchema);
module.exports = {
  author: author,
  authorSchema: authorSchema
};