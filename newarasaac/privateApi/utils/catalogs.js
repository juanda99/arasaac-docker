const filenamify = require('filenamify')
const fs = require('fs-extra')
const path = require('path')
const client = require('scp2')
const { exec } = require('child_process')
const logger = require('./logger')
const {
  hair,
  skin,
  IMAGE_DIR,
  tmpCatalogDir,
  WS_CATALOG_STATUS
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
  logger.debug(`CREATING CATALOG: Getting data from database`)
  catalogStatus[locale].step = 1
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
  catalogStatus[locale].complete = 5
  io.emit(WS_CATALOG_STATUS, catalogStatus)
  if (locale === 'es') {
    catalogStatus[locale].complete = 10
    io.emit(WS_CATALOG_STATUS, catalogStatus)
    return catalogData
  }
  const esPictograms = await Pictograms['es']
    .find({}, { idPictogram: 1, keywords: 1, _id: 0 })
    .lean()
  catalogStatus[locale].complete = 7
  io.emit(WS_CATALOG_STATUS, catalogStatus)
  const esCatalogData = esPictograms.map(pictogram => {
    const types = uniq(pictogram.keywords.map(keyword => keyword.type))
    return { idPictogram: pictogram.idPictogram, types: types }
  })
  catalogStatus[locale].complete = 8
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
  catalogStatus[locale].complete = 10
  io.emit(WS_CATALOG_STATUS, catalogStatus)
  return completeCatalogData
}

const getFilesCatalog = async (locale, catalogData, io) => {
  catalogStatus[locale].step = 2
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
  try {
    await fs.ensureLink(input, output)
    logger.debug(`CREATING CATALOG: Copied filed ${input} to ${output}`)
    if (isVariation) catalogStatistics[locale].variations += 1
    catalogStatistics[locale].totalFiles += 1
    const nowFiles = catalogStatistics[locale].totalFiles
    if (nowFiles - previousFiles > 3000) {
      const complete = (nowFiles / 70000).toFixed(2) * 0.2
      catalogStatus[locale].complete += complete
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
  logger.error(`PUBLISHING CATALOG ${locale}`)
  catalogStatus[locale].step = 4
  catalogStatus[locale].complete = 90
  io.emit(WS_CATALOG_STATUS, catalogStatus)
  console.log(`scp ${file} ${destination}`)
  exec(`scp ${file} ${destination}`, (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      catalogStatus[locale].error = true
      io.emit(WS_CATALOG_STATUS, catalogStatus)
      console.log(`stderr: ${stderr}`)
    } else {
      catalogStatus[locale].complete = 100
      io.emit(WS_CATALOG_STATUS, catalogStatus)
      console.log(`stdout: ${stdout}`)
    }
    // the *entire* stdout and stderr (buffered)
  })
}

module.exports = {
  getCatalogData,
  getFilesCatalog,
  publishCatalog
}
