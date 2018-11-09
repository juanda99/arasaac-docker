const fs = require('fs-extra')
const path = require('path')
const MATERIALS = process.env.MATERIALS || '/app/materials'
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const { NO_VERB_CONJUGATION_AVAILABLE } = require('./constants')

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

const getVerbixConjugations = async (language, word) => {
  const result = {}
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
  const valores = $('#verbixConjugations div')
  $(valores).each((i, element) => {
    tiempo = $(element)
      .children('h3')
      .text()
    modo = $(element)
      .children('h2')
      .text()
    const scrapVerbTenses = $('.pure-u-1-2', element)
    $(scrapVerbTenses).each((i, verbTense) => {
      tiempo = $(verbTense)
        .children('h3')
        .text()
      const scrapVerbos = $('.normal, .orto, .irregular', verbTense)
      $(scrapVerbos).each((i, verb) => {
        verbos.push($(verb).text())
      })
      if (tiempo && modo) {
        if (!result[modo]) result[modo] = {}
        result[modo][tiempo] = verbos
      }
      verbos = []
    })
  })
  await browser.close()
  return { word, language, verbTenses: result }
}

module.exports = {
  saveFilesByType,
  getVerbixConjugations
}
