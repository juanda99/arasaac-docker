const stopwords = require('stopwords-iso')
const sw = require('stopword')

const stopWords = (searchText, locale) => {
  let newLocale = locale
  if (locale==='zhs' || locale==='cr') return searchText
  if (locale==='val') newLocale='ca'
  if (locale==='br') newLocale='pt'
  if (locale==='ara') newLocale='ar'
  let searchItems = searchText.split(' ')
  if (searchItems.length===1) return searchText
  return sw.removeStopwords(searchItems, stopwords[newLocale]).join(' ')
}

module.exports = stopWords