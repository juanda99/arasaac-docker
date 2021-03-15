// move  locutions from id.mp3 to keyword.mp3

const path = require('path')
const fs = require('fs')
const locale = 'it'
const palabras = require(`./${locale}.json`)

const languageCodes = {
  es: 0,
  ru: 1,
  ro: 2,
  ar: 3,
  zh: 4,
  bg: 5,
  pl: 6,
  en: 7,
  fr: 8,
  ca: 9,
  de: 11,
  it: 12,
}

const ORIGIN_DIR = `/Users/juandaniel/Code/arasaac-docker/newarasaac/locutions/${languageCodes[locale]}`
const NEW_DIR = `/Users/juandaniel/Code/arasaac-docker/newarasaac/locutions/${locale}`

// passsing directoryPath and callback function
fs.readdir(ORIGIN_DIR, function (err, files) {
  // handling error
  if (err) {
    return console.log('Unable to scan directory: ' + err)
  }
  // listing all files using forEach
  files.forEach(function (file) {
    palabras.forEach((palabra) => {
      if (file === `${palabra.id}.mp3`) {
        if (palabra.word.toString().indexOf('/') !== -1) {
          console.log(`${palabra.id}.mp3 with ${palabra.word}`)
          const tmpKeyword = palabra.word
            .toString()
            .split('/')
            .join('\\\\')
            .toLowerCase()
          try {
            fs.copyFile(
              path.resolve(ORIGIN_DIR, file),
              path.resolve(NEW_DIR, `${tmpKeyword}.mp3`),
              (err) => {
                if (err) throw err
              }
            )
          } catch (e) {
            console.log(e.message)
          }
        } else {
          fs.copyFile(
            path.resolve(ORIGIN_DIR, file),
            path.resolve(
              NEW_DIR,
              `${palabra.word.toString().toLowerCase()}.mp3`
            ),
            (err) => {
              if (err) throw err
            }
          )
        }
      }
    })
  })
})
