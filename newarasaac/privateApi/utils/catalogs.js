const filenamify = require('filenamify')
const fs = require('fs-extra')
const path = require('path')
var Rsync = require('rsync')
const logger = require('./logger')
const {
  hair,
  skin,
  IMAGE_DIR,
  tmpCatalogDir,
  WS_CATALOG_STATUS,
  catalogProgress
} = require('./constants')
const languages = require('./languages')
const setPictogramModel = require('../models/Pictogram')
let previousFiles = 0 // for sending progress bar info

/* global catalogStatus, catalogStatistics */

const Pictograms = languages.reduce((dict, language) => {
  dict[language] = setPictogramModel(language)
  return dict
}, {})

const getCatalogData = async (locale, io) => {
  const step = 1
  const init = catalogProgress[step - 1].init
  const duration = catalogProgress[step - 1].duration
  logger.debug(`CREATING CATALOG: Getting data from database`)
  catalogStatus[locale].step = step
  catalogStatus[locale].info = ''
  catalogStatus[locale].error = false
  io.emit(WS_CATALOG_STATUS, catalogStatus)
  const pictograms = await Pictograms[locale]
    .find({}, { idPictogram: 1, keywords: 1, _id: 0 })
    .lean()
  var numFiles = 0
  const catalogData = pictograms.map(pictogram => {
    numFiles = numFiles + 1
    const keywords = pictogram.keywords
      .map(keyword => keyword.keyword)
      .join('_')
      .replace(/(_)\1+/g, '_')
      .replace(/_\s*$/, '')
      .replace(/^_/, '')
    const plurals = pictogram.keywords
      .map(keyword => keyword.plural)
      .join('_')
      .replace(/(_)\1+/g, '_')
      .replace(/_\s*$/, '')
      .replace(/^_/, '')
    const verbs = pictogram.keywords
      .filter(keyword => keyword.type === 3)
      .map(keyword => keyword.keyword)
      .join('_')
      .replace(/(_)\1+/g, '_')
      .replace(/_\s*$/, '')
      .replace(/^_/, '')
    const types = uniq(pictogram.keywords.map(keyword => keyword.type))
    return {
      idPictogram: pictogram.idPictogram,
      keywords: filenamify(keywords, { replacement: '' }),
      types,
      plurals: filenamify(plurals, { replacement: '' }),
      verbs: filenamify(verbs, { replacement: '' })
    }
  })
  catalogStatus[locale].complete = init + duration / 2
  io.emit(WS_CATALOG_STATUS, catalogStatus)
  if (locale === 'es') {
    catalogStatus[locale].complete = init + duration
    io.emit(WS_CATALOG_STATUS, catalogStatus)
    return catalogData
  }
  const esPictograms = await Pictograms['es']
    .find({}, { idPictogram: 1, keywords: 1, _id: 0 })
    .lean()
  catalogStatus[locale].complete = init + duration / 2 + duration / 5
  io.emit(WS_CATALOG_STATUS, catalogStatus)
  const esCatalogData = esPictograms.map(pictogram => {
    const types = uniq(pictogram.keywords.map(keyword => keyword.type))
    return { idPictogram: pictogram.idPictogram, types: types }
  })
  catalogStatus[locale].complete = init + duration / 2 + 2 * duration / 5
  io.emit(WS_CATALOG_STATUS, catalogStatus)
  // pictos without keywords, doesn't have types (for plural and verbs)
  // we fill catalog typs from esCatalog
  const completeCatalogData = catalogData.map(pictogram => {
    if (pictogram.keywords === '') {
      esCatalogData.forEach(esPictogram => {
        if (esPictogram.idPictogram === pictogram.idPictogram) {
          pictogram.types = esPictogram.types
        }
      })
    }
    return pictogram
  })
  catalogStatus[locale].complete = init + duration
  io.emit(WS_CATALOG_STATUS, catalogStatus)
  return completeCatalogData
}

const getFilesCatalog = async (locale, catalogData, io) => {
  const step = 2
  const init = catalogProgress[step - 1].init
  catalogStatus[locale].step = step
  catalogStatus[locale].info = ''
  catalogStatus[locale].error = false
  catalogStatus[locale].complete = init
  logger.debug(`CREATING CATALOG: Getting files from folder`)
  io.emit(WS_CATALOG_STATUS, catalogStatus)
  return Promise.all(
    catalogData.map(async pictogram => {
      const plurals =
        locale === 'es'
          ? !!pictogram.plurals
          : pictogram.types.some(type => type === 2 || type === 4)
      const action = pictogram.types.some(type => type === 3)
      return Promise.all([
        getDefaultFile(pictogram, locale, io),
        getPluralFile(pictogram, plurals, locale, io),
        getActionFiles(pictogram, action, locale, io),
        getPeopleFiles(pictogram, plurals, action, locale, io)
      ])
    })
  )
}

const getDefaultFile = async (pictogram, locale, io) => {
  const TMP_DIR = tmpCatalogDir(locale)
  const inputFile = await path.resolve(
    IMAGE_DIR,
    pictogram.idPictogram.toString(),
    `${pictogram.idPictogram}_500.png`
  )
  const outputFile = path.resolve(
    TMP_DIR,
    `${pictogram.keywords}_${pictogram.idPictogram}.png`
  )
  return copyFiles(inputFile, outputFile, false, locale, io)
}

const getPluralFile = async (pictogram, plurals, locale, io) => {
  const TMP_DIR = tmpCatalogDir(locale)
  if (plurals) {
    const inputFile = path.resolve(
      IMAGE_DIR,
      pictogram.idPictogram.toString(),
      `${pictogram.idPictogram}_plural_500.png`
    )
    const outputFile = path.resolve(
      TMP_DIR,
      `${pictogram.plurals || pictogram.keywords}_plural_${
        pictogram.idPictogram
      }.png`
    )

    return copyFiles(inputFile, outputFile, false, locale, io)
  }
}

const getActionFiles = async (pictogram, action, locale, io) => {
  const TMP_DIR = tmpCatalogDir(locale)
  if (action) {
    return Promise.all(
      ['past', 'future'].map(async action => {
        const inputFile = path.resolve(
          IMAGE_DIR,
          pictogram.idPictogram.toString(),
          `${pictogram.idPictogram}_action-${action}_500.png`
        )
        const outputFile = path.resolve(
          TMP_DIR,
          `${pictogram.verbs}_${action}_${pictogram.idPictogram}.png`
        )
        return copyFiles(inputFile, outputFile, false, locale, io)
      })
    )
  }
}

const getPeopleFiles = async (pictogram, plurals, action, locale, io) =>
  Promise.all([
    getCommonPeopleFiles(pictogram, locale, io),
    getPluralPeopleFiles(pictogram, plurals, locale, io),
    getActionPeopleFiles(pictogram, action, locale, io)
  ])

const getCommonPeopleFiles = async (pictogram, locale, io) => {
  const TMP_DIR = tmpCatalogDir(locale)
  return Promise.all(
    peopleVariations.map(async person => {
      const inputFile = path.resolve(
        IMAGE_DIR,
        pictogram.idPictogram.toString(),
        `${pictogram.idPictogram}_hair-${person.hair}_skin-${
          person.skin
        }_500.png`
      )
      const existInputFile = await fs.exists(inputFile)
      if (existInputFile) {
        const outputFile = path.resolve(
          TMP_DIR,
          pictogram.idPictogram.toString(),
          `${pictogram.keywords}_hair-${person.hair}_skin-${person.skin}_${
            pictogram.idPictogram
          }.png`
        )
        return copyFiles(inputFile, outputFile, true, locale, io)
      }
    })
  )
}

const getPluralPeopleFiles = async (pictogram, plurals, locale, io) => {
  const TMP_DIR = tmpCatalogDir(locale)
  if (plurals) {
    return Promise.all(
      peopleVariations.map(async person => {
        const inputFile = path.resolve(
          IMAGE_DIR,
          pictogram.idPictogram.toString(),
          `${pictogram.idPictogram}_plural_hair-${person.hair}_skin-${
            person.skin
          }_500.png`
        )
        const existInputFile = await fs.exists(inputFile)
        if (existInputFile) {
          const outputFile = path.resolve(
            TMP_DIR,
            pictogram.idPictogram.toString(),
            `${pictogram.plurals || pictogram.keywords}_plural_hair-${
              person.hair
            }_skin-${person.skin}_${pictogram.idPictogram}.png`
          )
          return copyFiles(inputFile, outputFile, true, locale, io)
        }
      })
    )
  }
}

const getActionPeopleFiles = async (pictogram, action, locale, io) => {
  const TMP_DIR = tmpCatalogDir(locale)
  if (action) {
    return Promise.all(
      peopleVariations.map(async person =>
        Promise.all(
          ['past', 'future'].map(async action => {
            const inputFile = path.resolve(
              IMAGE_DIR,
              pictogram.idPictogram.toString(),
              `${pictogram.idPictogram}_action-${action}_hair-${
                person.hair
              }_skin-${person.skin}_500.png`
            )
            const existInputFile = await fs.exists(inputFile)
            if (existInputFile) {
              const outputFile = path.resolve(
                TMP_DIR,
                pictogram.idPictogram.toString(),
                `${pictogram.verbs}_${action}_hair-${person.hair}_skin-${
                  person.skin
                }_${pictogram.idPictogram}.png`
              )
              return copyFiles(inputFile, outputFile, true, locale, io)
            }
          })
        )
      )
    )
  }
}

const peopleVariations = [
  { hair: hair.darkBrown.substring(1), skin: skin.white.substring(1) },
  { hair: hair.black.substring(1), skin: skin.black.substring(1) },
  { hair: hair.darkBrown.substring(1), skin: skin.assian.substring(1) },
  { hair: hair.darkBrown.substring(1), skin: skin.mulatto.substring(1) },
  { hair: hair.darkBrown.substring(1), skin: skin.aztec.substring(1) }
]

const copyFiles = async (input, output, isVariation, locale, io) => {
  const step = 2
  const init = catalogProgress[step - 1].init
  const duration = catalogProgress[step - 1].duration
  try {
    await fs.ensureLink(input, output)
    logger.debug(`CREATING CATALOG: Copied filed ${input} to ${output}`)
    if (isVariation) catalogStatistics[locale].variations += 1
    catalogStatistics[locale].totalFiles += 1
    const nowFiles = catalogStatistics[locale].totalFiles
    if (nowFiles - previousFiles > 3000) {
      const complete = (nowFiles / 70000).toFixed(2)
      catalogStatus[locale].complete = init + complete * duration / 100
      catalogStatus[locale].info = nowFiles
      previousFiles = nowFiles
      // hardcode numFiles. Could be more so we make this hack so progress bar gets hold:
      // 30% of time with generatingCatalogData (10%) and gettingFiles(20%)
      if (complete < 30) io.emit(WS_CATALOG_STATUS, catalogStatus)
    }
  } catch (err) {
    logger.error(`CREATING CATALOG: ${err.message}`)
  }
}

const uniq = a => [...new Set(a)]

const publishCatalog = async (file, destination, locale, io) => {
  // init progressBar:
  const step = 4
  const init = catalogProgress[step - 1].init
  const duration = catalogProgress[step - 1].duration

  logger.info(`PUBLISHING CATALOG ${locale}`)
  catalogStatus[locale].step = step
  catalogStatus[locale].complete = init
  catalogStatus[locale].info = ''
  io.emit(WS_CATALOG_STATUS, catalogStatus)

  const rsync = new Rsync()
    .shell('ssh')
    .flags('az')
    .set('info', 'progress2') // see https://github.com/mattijs/node-rsync/issues/49
    .set('no-inc-recursive')
    .source(file)
    .destination(destination)

  // Execute the command
  rsync.execute(
    (err, code, cmd) => {
      logger.debug(`COMMAND EXECUTED: ${cmd}`)
      logger.debug(`RETURNED VALUE: ${code}`)
      if (err) {
        logger.error(`PUBLISHING CATALOG FAILED!: ${err}`)
        catalogStatus[locale].error = true
        io.emit(WS_CATALOG_STATUS, catalogStatus)
      } else {
        logger.info('PUBLISHING CATALOG DONE')
        catalogStatus[locale].complete = init + duration
        io.emit(WS_CATALOG_STATUS, catalogStatus)
      }
    },
    data => {
      const arrayValues = data
        .toString('utf-8')
        .replace(/\s\s+/g, ' ')
        .split(' ')
      if (arrayValues[2]) {
        const percent = arrayValues[2].slice(0, -1)
        const speed = arrayValues[3]
        logger.debug(data)
        catalogStatus[locale].info = `${parseFloat(percent).toFixed(
          2
        )}% - ${speed}`
        catalogStatus[locale].complete = init + percent * duration / 100
        io.emit(WS_CATALOG_STATUS, catalogStatus)
      }
    },
    error => {
      logger.error(error)
      catalogStatus[locale].error = true
      io.emit(WS_CATALOG_STATUS, catalogStatus)
    }
  )
}

module.exports = {
  getCatalogData,
  getFilesCatalog,
  publishCatalog
}
