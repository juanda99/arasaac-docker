const stopwords = require('stopwords-iso')
const sw = require('stopword')

const stopWords = (searchText, locale) => {
  let newLocale = locale
  if (locale === 'zh' || locale === 'hr') return searchText
  if (locale === 'val') newLocale = 'ca'
  if (locale === 'br') newLocale = 'pt'
  const searchItems = searchText.split(' ')
  if (searchItems.length === 1) return searchText
  return sw.removeStopwords(searchItems, stopwords[newLocale]).join(' ')
}

module.exports = stopWords
