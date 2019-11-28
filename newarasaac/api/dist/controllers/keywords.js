"use strict";

var Keywords = require('../models/Keyword');

module.exports = {
  getAll: function getAll(req, res) {
    var language = req.swagger.params.language.value;
    Keywords.findOne({
      language: language
    }, function (err, keywords) {
      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      console.log(keywords);
      return res.json(keywords);
    });
  }
};