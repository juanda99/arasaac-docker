const fs = require('fs-extra')
const path = require('path')
const MATERIALS = process.env.MATERIALS || '/app/materials'
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const CustomError = require('../utils/CustomError')
const logger = require('../utils/logger')
const { PAST, PRESENT, FUTURE } = require('./constants')
const _ = require('lodash')
const { CONJUGATIONS_DIR } = require('../utils/constants')

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
  const destDir = path.resolve(dir, files.name)
  return fs.move(files.path, destDir)
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
    cr: 204,
    nl: 24
  }
  const languageCode = verbixCodeLanguages[language]
  if (!languageCode) {
    throw new CustomError(
      `Can't get ${word} conjugation in language ${language}. Availabe languages: ${Object.keys(
        verbixCodeLanguages
      ).join(', ')} `,
      404
    )
  }
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
    case 'Perfect':
    case 'Perfet': // ca
    case 'Perfeito': // pt
    case 'Imperfect': // en
    case 'Imparfait': // fr
    case 'Imperfet': // ca
    case 'Imperfeito': // pt
    case 'Mais-que-perfeito': // pt
    case 'Pretérito': // pt
    case 'Condicional perfeito': // pt
    case 'Past':
    case 'Passé': // fr
    case 'Passé simple': // fr
    case 'Passat simple': // ca
    case 'Pluperfect':
    case 'Preterite':
    case 'Preterite Perfect':
    case 'Passé composé': // fr
    case 'Passé antérieur': // fr
    case 'Passat anterior': // ca
    case 'Passat perifràstic': // ca
    case 'Passat anterior perifràstic': // ca
    case 'Passat anterior perifràsticr': // ca bug, last r!
    case 'Condicional perfet': // ca
    case 'Plus-que-parfait': // fr
    case 'Plusquamperfet': // ca
    case 'Passato prossimo': // it
    case 'Passato': // it
    case 'Imperfetto': // it
    case 'Trapassato prossimo': // it
    case 'Passato remoto': // it
    case 'Trapassato remoto': // it
      return PAST
    case 'Future':
    case 'Futuro': // pt, it
    case 'Futuro anterior': // pt
    case 'Futuro anteriore': // it
    case 'Futur simple': // fr, ca
    case 'Futur antérieur': // fr
    case 'Future I': // de
    case 'Future II': // de
    case 'Future Perfect':
    case 'Futur perfet': // ca
      return FUTURE
    default:
      return PRESENT
  }
}

const getVerbixConjugations = async (language, word) => {
  let result = {}
  let verbs = []
  let tiempo
  let modo
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 3000000
  })
  // if language is russian get word as verbix wants it

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
          verbs = verbo.split(' - ')
          if (!result[modo]) result[modo] = {}
          if (!result[modo][i]) result[modo][i] = {}
          result[modo][i] = {
            verbs,
            considered: checkTense(language, i)
          }
          verbs = []
        })
      } else {
        $('.columns-sub>div', this).each(function (i, element) {
          tiempo = $('h4', element).text()
          if (tiempo) {
            $('.normal, .orto, .irregular', this).each((i, verb) => {
              verbs.push($(verb).text())
            })
            if (!result[modo]) result[modo] = {}
            if (!result[modo][tiempo]) result[modo][tiempo] = {}
            result[modo][tiempo] = {
              verbs: verbs,
              considered: checkTense(language, tiempo)
            }
          }
          verbs = []
          tiempo = ''
        })
      }
    }
  })
  await browser.close()
  // if empty verbalTenses, throw error:
  if (Object.entries(result).length === 0 && result.constructor === Object) {
    throw new CustomError(
      `Can't get conjugations for verb ${word} in language ${language}`,
      404
    )
  }
  return { word, language, verbTenses: result }
}

const getConjugationsFile = (language, word) =>
  path.resolve(CONJUGATIONS_DIR, language, `${word}.json`)
const getConjugationsDir = language => path.resolve(CONJUGATIONS_DIR, language)

const readConjugations = async (language, word) => {
  const conjugationsFile = getConjugationsFile(language, word)
  logger.debug(`Trying to get conjugations from local file ${conjugationsFile}`)
  try {
    const conjugations = await fs.readJson(conjugationsFile)
    return conjugations
  } catch (err) {
    logger.info(
      `No file for conjugations found for verb ${word} and language ${language}. We'll ask verbix`
    )
    return false
  }
}

// get verbs for a verbalTense (PRESENT, PAST, FUTURE) in a json data (verbs)
const getDeclinations = (verbalTense, verbs) =>
  _.flattenDeep(
    Object.values(verbs.verbTenses).map(tenses =>
      Object.values(tenses)
        .filter(tense => tense.considered === verbalTense)
        .map(tense => tense.verbs)
    )
  )

const saveConjugations = async (language, word, content) => {
  const conjugationsFile = getConjugationsFile(language, word)
  try {
    await fs.ensureDir(getConjugationsDir(language))
    await fs.writeJson(conjugationsFile, content)
    logger.debug(
      `Saved conjugations file for verb ${word} and language ${language}`
    )
  } catch (err) {
    logger.error(
      `Can't save conjugations file for verb ${word} and language ${language}: ${
        err.message
      }`
    )
  }
}

module.exports = {
  saveFilesByType,
  getVerbixConjugations,
  readConjugations,
  saveConjugations,
  getDeclinations
}
