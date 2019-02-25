const { getCatalogData, getFilesCatalog } = require('../utils/catalogs')
const { tmpCatalogDir, CATALOG_DIR } = require('../utils/constants')
const logger = require('../utils/logger')
const languages = require('../utils/languages')
const { compressDirToZip } = require('../utils/compress')

let generatingCatalog = false

const createCatalogByLanguage = async (req, res, io) => {
  const { locale } = req.params
  try {
    logger.info(`CREATING CATALOG FOR LANGUAGE ${locale.toUpperCase()}`)
    if (generatingCatalog) res.json({ server: 'executing!!!' })
    generatingCatalog = true
    if (!locale) throw new CustomError('Parameter language not defined', 400)
    if (!languages.some(language => language === locale)) {
      throw new CustomError(
        `Parameter language not valid. Allowed values: ${languages.join(', ')}`,
        400
      )
    }
    logger.debug(`CREATING CATALOG: Getting data from database`)
    // const catalogData = await getCatalogData(locale)
    logger.debug(`CREATING CATALOG: Getting files from folder`)
    // await getFilesCatalog(locale, catalogData)
    // generate file and get statistics to save in database and res
    // websockets?????
    logger.debug(`CREATING CATALOG: Generating zip file`)
    compressDirToZip(
      tmpCatalogDir(locale),
      `${CATALOG_DIR}/catalog_${locale}.zip`,
      io
    )
    // now remove tmp files...
    logger.info(`CATALOG FOR LANGUAGE ${locale.toUpperCase()} CREATED`)
    generatingCatalog = false
    return res.json({ resultado: 'ok' })
    // return res.json(catalogData)
  } catch (err) {
    generatingCatalog = false
    logger.error(`ERROR GENERATIG CATALOG: ${err.message}`)
    return res.status(err.httpCode || 500).json({
      message: 'Error generating catalog. See error field for detail',
      error: err.message
    })
  }
}

const createAllCatalogs = async (req, res) => {
  // const { locale } = req.params
}

var error = new Error('Could not access the file')
error.code = 'EACCES'

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
