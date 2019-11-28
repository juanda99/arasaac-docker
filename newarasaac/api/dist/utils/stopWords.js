"use strict";

var stopwords = require('stopwords-iso');

var sw = require('stopword');

var stopWords = function stopWords(searchText, locale) {
  var newLocale = locale;
  if (locale === 'zh' || locale === 'hr') return searchText;
  if (locale === 'val') newLocale = 'ca';
  if (locale === 'br') newLocale = 'pt';
  var searchItems = searchText.split(' ');
  if (searchItems.length === 1) return searchText;
  return sw.removeStopwords(searchItems, stopwords[newLocale]).join(' ');
};

module.exports = stopWords;