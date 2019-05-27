const fs = require('fs-extra')
const path = require('path')
const MATERIALS = process.env.MATERIALS || '/app/materials'
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const {
  NO_VERB_CONJUGATION_AVAILABLE,
  PAST,
  PRESENT,
  FUTURE
} = require('./constants')

const saveFiles = async (files, dir) => {
  await fs.ensureDir(dir)
  if (Array.isArray(files)) {
    return Promise.all(
      files.map(file => {
        const destDir = path.resolve(dir, file.name)
        return fs.move(file.path, destDir)
      })
    )
  }
  const destDir = path.resolve(dir, file.name)
  return fs.move(file.path, destDir)
}

const getUrl = (language, word) => {
  const verbixCodeLanguages = {
    ru: 214,
    ro: 5,
    es: 1,
    pt: 2,
    fr: 3,
    ca: 7,
    ga: 6,
    ar: 61,
    pl: 201,
    it: 4,
    de: 13,
    en: 20,
    cr: 204
  }
  const languageCode = verbixCodeLanguages[language]
  if (!languageCode) throw Error(NO_VERB_CONJUGATION_AVAILABLE)
  return `http://www.verbix.com/webverbix/go.php?T1=${word}&D1=${languageCode}`
}
const saveFilesByType = async (formFiles, id) => {
  const filePromises = []
  let filesPromise
  let screenshotsPromise
  const langFilesPattern = new RegExp(`^[A-z]{2,3}langFiles$`, 'i')
  const langScreenshotsPattern = new RegExp(`^[A-z]{2,3}langScreenshots$`, 'i')

  if (formFiles.files) {
    filePromise = saveFiles(
      formFiles.files,
      path.resolve(MATERIALS, `${id}`, 'files')
    )
  }

  if (formFiles.screnshots) {
    screenshotsPromise = saveFiles(
      formFiles.screenshots,
      path.resolve(MATERIALS, `${id}`, 'files')
    )
  }

  const langFiles = Object.keys(formFiles).filter(key =>
    langFilesPattern.test(key)
  )

  const langFilesPromises = langFiles.map(langFile => {
    const locale = langFile.substr(0, langFile.indexOf('langFile'))
    return saveFiles(
      formFiles[langFile],
      path.resolve(MATERIALS, `${id}`, locale, 'files')
    )
  })

  const langScreenshotsFiles = Object.keys(formFiles).filter(key =>
    langScreenshotsPattern.test(key)
  )

  const langScreenshotsPromises = langScreenshotsFiles.map(langScreenshot => {
    const locale = langScreenshot.substr(
      0,
      langScreenshot.indexOf('langScreenshot')
    )
    return saveFiles(
      formFiles[langScreenshot],
      path.resolve(MATERIALS, `${id}`, locale, 'screenshots')
    )
  })

  return Promise.all([
    filesPromise,
    screenshotsPromise,
    ...langFilesPromises,
    ...langScreenshotsPromises
  ])
}

const checkTense = (language, tense) => {
  switch (tense) {
    case '1':
    case 1:
    case 'Perfect':
    case 'Past':
    case 'Pluperfect':
    case 'Preterite':
    case 'Preterite Perfect':
      return PAST
    case 'Future':
    case 'Future Perfect':
      return FUTURE
    default:
      return PRESENT
  }
}

const getVerbixConjugations = async (language, word) => {
  let result = {}
  let verbos = []
  let tiempo
  let modo
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 3000000
  })
  const page = await browser.newPage()
  await page.goto(getUrl(language, word))
  const content = await page.content()
  const $ = cheerio.load(content)

  $('.columns-main>div').each(function (i, element) {
    modo = $('h3', element).text()
    if (modo) {
      if (modo === 'Nominal Forms') {
        $('.normal, .orto, .irregular', element).each((i, verb) => {
          const verbo = $(verb).text()
          console.log(verbo)
          verbos = verbo.split(' - ')
          console.log(verbos)
          if (!result[modo]) result[modo] = {}
          if (!result[modo][i]) result[modo][i] = {}
          result[modo][i] = {
            verbos,
            considered: checkTense(language, i)
          }
          verbos = []
        })
      } else {
        $('.columns-sub>div', this).each(function (i, element) {
          tiempo = $('h4', element).text()
          if (tiempo) {
            $('.normal, .orto, .irregular', this).each((i, verb) => {
              verbos.push($(verb).text())
            })
            if (!result[modo]) result[modo] = {}
            if (!result[modo][tiempo]) result[modo][tiempo] = {}
            result[modo][tiempo] = {
              verbs: verbos,
              considered: checkTense(language, tiempo)
            }
          }
          verbos = []
          tiempo = ''
        })
      }
    }
  })
  await browser.close()
  return { word, language, verbTenses: result }
}

module.exports = {
  saveFilesByType,
  getVerbixConjugations
}
