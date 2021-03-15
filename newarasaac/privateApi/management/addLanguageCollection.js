/* script used for adding a new language to mongodb */
var fs = require('fs')
const newLanguage = 'sr'
var outputFilename = `./pictos_${newLanguage}.json`
const pictos = require('./pictos_en.json')
const newPictos = pictos.filter((picto) => {
  picto.keywords = []
  picto.validated = false
  return picto
})
fs.writeFile(outputFilename, JSON.stringify(newPictos, null, 4), (err) => {
  console.log(err)
})
// console.log(JSON.stringify(newPictos));
