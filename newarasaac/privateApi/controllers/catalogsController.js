const {
  getCatalogData,
  getFilesCatalog,
  publishCatalog
} = require('../utils/catalogs')
const {
  tmpCatalogDir,
  CATALOG_DIR,
  WS_CATALOG_STATUS
} = require('../utils/constants')
const path = require('path')
const logger = require('../utils/logger')
const languages = require('../utils/languages')
const { compressDirToZip } = require('../utils/compress')

/* global catalogStatus, catalogStatistics */
var generatingCatalog = false
global.catalogStatus = {}
global.catalogStatistics = {}

const initCatalogStatistics = locale => {
  catalogStatistics[locale] = {
    totalFiles: 0,
    variations: 0,
    size: 0
  }
}
const initCatalogStatus = locale => {
  catalogStatus[locale] = {
    step: 0,
    info: '',
    complete: 0,
    err: null
  }
}

const createCatalogByLanguage = async (req, res, io) => {
  const { locale } = req.params
  initCatalogStatistics(locale)
  initCatalogStatus(locale)
  try {
    logger.info(`CREATING CATALOG FOR LANGUAGE ${locale.toUpperCase()}`)
    if (generatingCatalog) {
      throw new CustomError('Another catalog request is being created', 403)
    }
    if (!locale) throw new CustomError('Parameter language not defined', 400)
    if (!languages.some(language => language === locale)) {
      throw new CustomError(
        `Parameter language not valid. Allowed values: ${languages.join(', ')}`,
        400
      )
    }
  } catch (err) {
    logger.error(`ERROR CREATING CATALOG: ${err.message}`)
    return res.status(err.httpCode || 500).json({
      message: 'Error generating catalog. See error field for detail',
      error: err.message
    })
  }

  /* now start generating and response via ajax, rest of process via websockets */
  generatingCatalog = true
  res
    .status(200)
    .json({ status: 'Your request has started, it will take a while.' })

  try {
    const catalogData = await getCatalogData(locale, io)
    await getFilesCatalog(locale, catalogData, io)
    const catalogFileName = path.resolve(CATALOG_DIR, `catalog_${locale}.zip`)
    await compressDirToZip(tmpCatalogDir(locale), catalogFileName, locale, io)
    await publishCatalog(
      catalogFileName,
      `storage.arasaac.org:/tmp/catalog_${locale}.zip`,
      locale,
      io
    )
    generatingCatalog = false
  } catch (err) {
    generatingCatalog = false
    logger.error(`ERROR CREATING CATALOG: ${err.message}`)
    catalogStatus[locale].err = true
    io.emit(WS_CATALOG_STATUS, catalogStatus)
  }
}

const createAllCatalogs = async (req, res, io) => {
  if (generatingCatalog) {
    return res
      .status(403)
      .json({ status: "Another catalog request it's being created" })
  }
  generatingCatalog = true
  res
    .status(200)
    .json({ status: 'Your request has started, it will take a while.' })

  const catalogPromises = languages.map(async (io, locale) => {
    logger.info(`CREATING CATALOG FOR LANGUAGE ${locale.toUpperCase()}`)
    logger.debug(`CREATING CATALOG: Getting data from database`)
    io.emit(WS_CATALOG_STATUS, catalogStatus)
    try {
      const catalogData = await getCatalogData(locale, io)
      logger.verbose(`CREATING CATALOG: Getting files from folder`)
      io.emit(WS_CATALOG_STATUS, catalogStatus)
      await getFilesCatalog(locale, catalogData, io)
      logger.verbose(`CREATING CATALOG: Generating zip file`)
      io.emit(WS_CATALOG_STATUS, catalogStatus)
      await compressDirToZip(
        tmpCatalogDir(locale),
        `${CATALOG_DIR}/catalog_${locale}.zip`,
        locale,
        io
      )

      logger.info(`CATALOG FOR LANGUAGE ${locale.toUpperCase()} CREATED`)
      io.emit(WS_CATALOG_STATUS, {
        status: `Catalog for language ${locale} created`
      })
    } catch (err) {
      generatingCatalog = false
      logger.error(`ERROR CREATING CATALOG: ${err.message}`)
      io.emit(WS_CATALOG_STATUS, {
        status: `Error creating catalog ${err.message}`
      })
    }
  })
  await Promise.all(catalogPromises)
  logger.info(`CREATED CATALOG FOR ALL LANGUAGES`)
}

class CustomError extends Error {
  constructor (message, code) {
    super(message)
    this.httpCode = code
    this.name = 'Custom error'
  }
}

module.exports = {
  createCatalogByLanguage,
  createAllCatalogs
}
