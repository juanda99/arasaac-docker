const {
  getCatalogData,
  getFilesCatalog,
  publishCatalog,
  saveCatalog,
  getTotalFiles,
  removeTmpFiles
} = require('../utils/catalogs')
const { CATALOG_DIR, WS_CATALOG_STATUS } = require('../utils/constants')
const path = require('path')
const Catalog = require('../models/Catalog')
const logger = require('../utils/logger')
const languages = require('../utils/languages')
const CustomError = require('../utils/CustomError')
const { compressDirToZip } = require('../utils/compress')

/* global catalogStatus, catalogStatistics */

global.catalogStatus = {}
global.catalogStatistics = {}

/* variable to prevent executing a catalog more than once at the same time */
const generatingCatalog = {}
languages.forEach(language => {
  generatingCatalog[language] = false
})

const initCatalogStatistics = async locale => {
  let totalFiles
  try {
    totalFiles = await getTotalFiles(locale)
    logger.info(
      `ESTIMATED CATALOG NUMBER OF FILES FOR LOCALE ${locale}: ${totalFiles}`
    )
  } catch (err) {
    // in case of a new catalog, stimated amount of files, could change in the future
    totalFiles = 100000
    logger.error(
      `UNKNOWN CATALOG NUMBER OF FILES for ${locale}, we use ${totalFiles}: ${err}`
    )
  }
  catalogStatistics[locale] = {
    colorPictograms: 0,
    noColorPictograms: 0,
    variations: 0,
    size: '',
    startTime: new Date(), // will be use to get the total amount of time
    totalFiles
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
  await initCatalogStatistics(locale)
  initCatalogStatus(locale)
  try {
    logger.info(`CREATING CATALOG FOR LANGUAGE ${locale.toUpperCase()}`)
    if (generatingCatalog[locale]) {
      throw new CustomError(
        `Another catalog request is being created for language ${locale}`,
        403
      )
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
  generatingCatalog[locale] = true
  if (!res.headersSent) {
    res
      .status(202)
      .json({ status: 'Your request has started, it will take a while.' })
  }

  try {
    const catalogData = await getCatalogData(locale, io)
    await getFilesCatalog(locale, catalogData, io)
    const catalogFileName = path.resolve(CATALOG_DIR, `catalog_${locale}.zip`)
    const tmpCatalogDir = path.resolve(CATALOG_DIR, 'tmp', locale)
    await compressDirToZip(tmpCatalogDir, catalogFileName, locale, io)
    await publishCatalog(
      catalogFileName,
      `${process.env.SFTP_SERVER}:/var/www/html/catalog_${locale}.zip`,
      locale,
      io
    )
    await saveCatalog(locale, io)
    // remove tmp files
    await removeTmpFiles(tmpCatalogDir)
    generatingCatalog[locale] = false
  } catch (err) {
    generatingCatalog[locale] = false
    logger.error(`ERROR CREATING CATALOG: ${err.message}`)
    catalogStatus[locale].err = true
    io.emit(WS_CATALOG_STATUS, catalogStatus)
  }
}

const createAllCatalogs = async (req, res, io) => {
  logger.info(`CREATE CATALOGS for languages: ${languages.join(', ')}`)
  for (const language of languages) {
    req.params.locale = language
    await createCatalogByLanguage(req, res, io)
  }
  logger.info(
    `FINISHED CREATING CATALOGS for languages: ${languages.join(', ')}`
  )
}

// generate all catalogs at the same time
// createAllCatalogs function in async mode
const createAllCatalogsAsync = async (req, res, io) => {
  logger.info(`CREATE CATALOGS for languages: ${languages.join(', ')}`)

  const promises = languages.map(language => {
    req.params.locale = language
    return createCatalogByLanguage(req, res, io)
  })
  await Promise.all(promises)
  logger.info(
    `FINISHED CREATING CATALOGS for languages: ${languages.join(', ')}`
  )
}

const getAllCatalogs = async (req, res) => {
  logger.debug(`GET CATALOGS DATA FROM ALL LANGUAGES: getAllCatalogs()`)
  try {
    const catalogs = await Catalog.find().lean()
    // if no catalog generated we send 404 but show all possible catalogs:
    if (!catalogs) {
      const noCatalogs = languages.map(language => ({ language }))
      return res.status(404).json(noCatalogs)
    }
    const languagesCatalog = languages.map(
      language =>
        catalogs.filter(catalog => catalog.language === language)[0] || {
          language
        }
    )
    return res.json(languagesCatalog)
  } catch (err) {
    logger.error(err.message)
    return res.status(500).json({
      message: 'Error searching pictogram. See error field for detail',
      error: err.message
    })
  }
}

const getCatalogsByLanguage = async (req, res) => {
  const { language } = req.params
  try {
    const catalogs = await Catalog.find({ language })
    if (catalogs.length === 0) return res.status(404).json([]) // send http code 404!!!
    return res.json(catalogs)
  } catch (err) {
    logger.error(err.message)
    return res.status(500).json({
      message: 'Error searching pictogram. See error field for detail',
      error: err.message
    })
  }
}

module.exports = {
  createCatalogByLanguage,
  createAllCatalogs,
  getAllCatalogs,
  getCatalogsByLanguage,
  createAllCatalogsAsync
}
