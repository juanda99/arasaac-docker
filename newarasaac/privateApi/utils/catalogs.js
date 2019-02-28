const filenamify = require('filenamify')
const fs = require('fs-extra')
const path = require('path')
var Rsync = require('rsync')
const Catalog = require('../models/Catalog')
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
        getPeopleFiles(pictogram, plurals, action, locale, io),
        getDefaultFileBN(pictogram, locale, io),
        getPluralFileBN(pictogram, plurals, locale, io),
        getActionFilesBN(pictogram, action, locale, io)
      ])
    })
  )
}

const getDefaultFile = async (pictogram, locale, io) => {
  const isBN = false
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
  return copyFiles(inputFile, outputFile, false, isBN, locale, io)
}

const getDefaultFileBN = async (pictogram, locale, io) => {
  const isBN = true
  const TMP_DIR = tmpCatalogDir(locale, isBN)
  const inputFile = await path.resolve(
    IMAGE_DIR,
    pictogram.idPictogram.toString(),
    `${pictogram.idPictogram}_nocolor_500.png`
  )
  const outputFile = path.resolve(
    TMP_DIR,
    `${pictogram.keywords}_${pictogram.idPictogram}.png`
  )
  return copyFiles(inputFile, outputFile, false, isBN, locale, io)
}

const getPluralFile = async (pictogram, plurals, locale, io) => {
  const isBN = false
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

    return copyFiles(inputFile, outputFile, false, isBN, locale, io)
  }
}

const getPluralFileBN = async (pictogram, plurals, locale, io) => {
  const isBN = true
  const TMP_DIR = tmpCatalogDir(locale, true)
  if (plurals) {
    const inputFile = path.resolve(
      IMAGE_DIR,
      pictogram.idPictogram.toString(),
      `${pictogram.idPictogram}_plural_nocolor_500.png`
    )
    const outputFile = path.resolve(
      TMP_DIR,
      `${pictogram.plurals || pictogram.keywords}_plural_${
        pictogram.idPictogram
      }.png`
    )

    return copyFiles(inputFile, outputFile, false, isBN, locale, io)
  }
}

const getActionFiles = async (pictogram, action, locale, io) => {
  const isBN = false
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
        return copyFiles(inputFile, outputFile, false, isBN, locale, io)
      })
    )
  }
}

const getActionFilesBN = async (pictogram, action, locale, io) => {
  const isBN = true
  const TMP_DIR = tmpCatalogDir(locale, true)
  if (action) {
    return Promise.all(
      ['past', 'future'].map(async action => {
        const inputFile = path.resolve(
          IMAGE_DIR,
          pictogram.idPictogram.toString(),
          `${pictogram.idPictogram}_nocolor_action-${action}_500.png`
        )
        const outputFile = path.resolve(
          TMP_DIR,
          `${pictogram.verbs}_${action}_${pictogram.idPictogram}.png`
        )
        return copyFiles(inputFile, outputFile, false, isBN, locale, io)
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
  const isBN = false
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
        return copyFiles(inputFile, outputFile, true, isBN, locale, io)
      }
    })
  )
}

const getPluralPeopleFiles = async (pictogram, plurals, locale, io) => {
  const isBN = false
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
          return copyFiles(inputFile, outputFile, true, isBN, locale, io)
        }
      })
    )
  }
}

const getActionPeopleFiles = async (pictogram, action, locale, io) => {
  const isBN = false
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
              return copyFiles(inputFile, outputFile, true, isBN, locale, io)
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

const copyFiles = async (input, output, isVariation, isBN, locale, io) => {
  const step = 2
  const init = catalogProgress[step - 1].init
  const duration = catalogProgress[step - 1].duration
  try {
    await fs.ensureLink(input, output)
    logger.debug(`CREATING CATALOG: Copied filed ${input} to ${output}`)
    if (isVariation) catalogStatistics[locale].variations += 1
    else if (isBN) catalogStatistics[locale].noColorPictograms += 1
    else catalogStatistics[locale].colorPictograms += 1
    const nowFiles =
      catalogStatistics[locale].variations +
      catalogStatistics[locale].noColorPictograms +
      catalogStatistics[locale].colorPictograms
    // every 4000 to 5000 files (random) we emit progress
    if (nowFiles - previousFiles > Math.floor(Math.random() * 5000) + 4000) {
      const complete = (
        nowFiles / catalogStatistics[locale].previousFiles
      ).toFixed(2)
      catalogStatus[locale].complete = init + complete * duration / 100
      catalogStatus[locale].info = nowFiles
      previousFiles = nowFiles
      // hardcode previousFiles from catalogStatistics could be hardcoded
      // Could be more so we make this hack so progress bar gets hold
      if (complete < init + duration) io.emit(WS_CATALOG_STATUS, catalogStatus)
    }
  } catch (err) {
    logger.error(`CREATING CATALOG: ${err.message}`)
  }
}

const uniq = a => [...new Set(a)]

const publishCatalog = (file, destination, locale, io) =>
  new Promise((resolve, reject) => {
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
      .set('delete-after') // receiver deletes after transfer, not during
      .set('remove-source-files') // remove source file afterwards
      .set('bwlimit', 10000) // 10 MBytes maximum
      .source(file)
      .destination(destination)

    // Execute the command
    rsync.execute(
      (err, code, cmd) => {
        logger.debug(`COMMAND EXECUTED: ${cmd}`)
        if (err) {
          logger.error(`PUBLISHING CATALOG FAILED!: ${err}`)
          logger.debug(`RETURNED VALUE: ${code}`)
          catalogStatus[locale].error = true
          io.emit(WS_CATALOG_STATUS, catalogStatus)
          reject(err)
        } else {
          logger.info('PUBLISHING CATALOG DONE')
          catalogStatus[locale].info = '100%'
          catalogStatus[locale].complete = init + duration
          io.emit(WS_CATALOG_STATUS, catalogStatus)
          resolve()
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
          logger.debug(`UPLOADING CATALOG ${locale}: ${percent}% ${speed}`)
          catalogStatus[locale].info = `${parseFloat(percent).toFixed(
            2
          )}% - ${speed}`
          catalogStatus[locale].complete = init + percent * duration / 100
          io.emit(WS_CATALOG_STATUS, catalogStatus)
        }
      },
      err => {
        logger.error(err)
        catalogStatus[locale].error = true
        io.emit(WS_CATALOG_STATUS, catalogStatus)
        reject(err)
      }
    )
  })

const saveCatalog = async (locale, io) => {
  // save in database:
  const catalog = {
    language: locale,
    status: 1, // published
    pictograms: catalogStatistics[locale].totalFiles,
    variations: catalogStatistics[locale].variations,
    size: catalogStatistics[locale].size,
    lastUpdate: Date.now
  }

  logger.debug(`SAVING CATALOG ${locale} IN DATABASE`)
  const step = 5
  const init = catalogProgress[step - 1].init
  const duration = catalogProgress[step - 1].duration
  catalogStatus[locale].step = step
  catalogStatus[locale].complete = init
  catalogStatus[locale].info = ''
  catalogStatus[locale].error = false
  io.emit(WS_CATALOG_STATUS, catalogStatus)

  await Catalog.findOneAndUpdate(
    { language: locale, category: 'General' },
    catalog, // document to insert when nothing was found
    { upsert: true, new: true, runValidators: true }
  )
  logger.debug(`SAVED CATALOG ${locale} IN DATABASE`)
  const time = new Date()
  const amountTime = time - catalogStatistics[locale].startTime // Difference in milliseconds.
  logger.info(`CREATED CATALOG ${locale} OK in ${amountTime / 1000} seconds `)
  catalogStatus[locale].complete = init + duration
  catalogStatus[locale].info = amountTime
  io.emit(WS_CATALOG_STATUS, catalogStatus)
}

const getTotalFiles = async language => {
  logger.debug(`SEARCHING CATALOG ${language} IN DATABASE`)
  const catalog = await Catalog.findOne({ language })
  if (catalog.length === 0) return 0
  return (
    catalog.colorPictograms + catalog.noColorPictograms + catalog.variations
  )
}

module.exports = {
  getCatalogData,
  getFilesCatalog,
  publishCatalog,
  saveCatalog,
  getTotalFiles
}
