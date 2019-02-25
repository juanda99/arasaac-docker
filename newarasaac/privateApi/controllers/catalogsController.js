const { getCatalogData, getFilesCatalog } = require('../utils/catalogs')
const {
  tmpCatalogDir,
  CATALOG_DIR,
  WS_CATALOG_STATUS
} = require('../utils/constants')
const logger = require('../utils/logger')
const languages = require('../utils/languages')
const { compressDirToZip } = require('../utils/compress')

/* global catalogStatus */
var generatingCatalog = false
global.catalogStatus = {}

const createCatalogByLanguage = async (req, res, io) => {
  const { locale } = req.params
  catalogStatus[locale] = {
    obtainingData: {
      status: false,
      complete: 0
    },
    gettingFiles: {
      status: false,
      complete: 0
    },
    compressing: {
      status: false,
      complete: 0
    },
    publishing: {
      status: false,
      complete: 0
    }
  }
  try {
    logger.info(`CREATING CATALOG FOR LANGUAGE ${locale.toUpperCase()}`)
    if (generatingCatalog) { throw new CustomError('Another catalog request is being created', 403) }
    if (!locale) throw new CustomError('Parameter language not defined', 400)
    if (!languages.some(language => language === locale)) {
      throw new CustomError(
        `Parameter language not valid. Allowed values: ${languages.join(', ')}`,
        400
      )
    }
    generatingCatalog = true
    res
      .status(200)
      .json({ status: 'Your request has started, it will take a while.' })
    const catalogData = await getCatalogData(locale)
    logger.debug(`CREATING CATALOG: Getting files from folder`)
    io.emit(WS_CATALOG_STATUS, { subStatus: `Getting files` })
    await getFilesCatalog(locale, catalogData)
    logger.debug(`CREATING CATALOG: Generating zip file`)
    io.emit(WS_CATALOG_STATUS, { subStatus: `Generating catalog file` })
    await compressDirToZip(
      tmpCatalogDir(locale),
      `${CATALOG_DIR}/catalog_${locale}.zip`,
      io
    )

    logger.info(`CATALOG FOR LANGUAGE ${locale.toUpperCase()} CREATED`)
    io.emit(WS_CATALOG_STATUS, {
      status: `Catalog for language ${locale} created`
    })
    return res.json({ resultado: 'ok' })
    // return res.json(catalogData)
  } catch (err) {
    generatingCatalog = false
    logger.error(`ERROR CREATING CATALOG: ${err.message}`)
    io.emit(WS_CATALOG_STATUS, {
      status: `Error creating catalog ${err.message}`
    })
    return res.status(err.httpCode || 500).json({
      message: 'Error generating catalog. See error field for detail',
      error: err.message
    })
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

  const catalogPromises = languages.map(async locale => {
    logger.info(`CREATING CATALOG FOR LANGUAGE ${locale.toUpperCase()}`)
    logger.debug(`CREATING CATALOG: Getting data from database`)
    io.emit(WS_CATALOG_STATUS, {
      status: `Creating catalog for language ${locale}`,
      subStatus: `Getting data`
    })
    try {
      const catalogData = await getCatalogData(locale)
      logger.verbose(`CREATING CATALOG: Getting files from folder`)
      io.emit(WS_CATALOG_STATUS, { subStatus: `Getting files` })
      await getFilesCatalog(locale, catalogData)
      logger.verbose(`CREATING CATALOG: Generating zip file`)
      io.emit(WS_CATALOG_STATUS, { subStatus: `Generating catalog file` })
      await compressDirToZip(
        tmpCatalogDir(locale),
        `${CATALOG_DIR}/catalog_${locale}.zip`,
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
