const Category = require('../models/Category')
const { ObjectID } = require('mongodb')
const { merge, pick } = require('lodash')
const logger = require('../utils/logger')
const languages = require('../utils/languages')
const CustomError = require('../utils/CustomError')
const removeKeys = require('../utils/removeKeys')
const get = async (req, res) => {
  const { locale, lastUpdated } = req.params
  let clientDate
  if (lastUpdated) {
    clientDate = new Date(lastUpdated)
    logger.debug(
      `Getting category for locale ${locale} if updated after: ${clientDate}`
    )
  } else logger.debug(`Getting category for data locale ${locale}`)
  try {
    const category = await Category.findOne({ locale: locale })
    if (!category) {
      throw new CustomError(`No categories found for locale ${locale}`, 404)
    }
    if (lastUpdated) {
      const serverDate = new Date(category.lastUpdated)
      if (clientDate.getTime() === serverDate.getTime()) {
        logger.debug(
          `Category data for language ${locale} already in the client for date ${lastUpdated}`
        )
        return res.status(202).json({})
      }
    }
    return res.json(category)
  } catch (err) {
    logger.error(
      `Error getting category data for locale ${locale}: ${err.message}`
    )
    res.status(err.httpCode || 500).json({
      message: `Error getting category data for locale ${locale}`,
      error: err.message
    })
  }
}

const update = async (req, res) => {
  const { _id, lastUpdated, locale, data } = req.body
  logger.debug(`Updating category for locale ${locale}`)
  try {
    if (!ObjectID.isValid(_id)) throw new CustomError(`Invalid id: ${_id}`, 404)
    const category = await Category.findOne({ locale })
    if (!category) {
      throw new CustomError(`Category not found for locale: ${locale}`, 404)
    }
    const serverDate = new Date(category.lastUpdated)
    const clientDate = new Date(lastUpdated)
    if (clientDate.getTime() < serverDate.getTime()) {
      throw new CustomError(`Client data is outdated`, 409)
    }
    const now = Date.now()
    category.lastUpdated = now
    category.data = data
    category.save()
    res.json({ lastUpdated: now })
  } catch (err) {
    logger.error(`Error updating category: ${err.message}`)
    res.status(err.httpCode || 500).json({
      message: 'Error updating category. See error field for detail',
      error: err.message
    })
  }
}

const add = async (req, res) => {
  const { _id, lastUpdated, locale, data } = req.body
  logger.debug(
    `Add category for all locales. Merging data from locale: ${locale}`
  )

  // first we update lang
  const now = Date.now()
  try {
    if (!ObjectID.isValid(_id)) throw new CustomError(`Invalid id: ${_id}`, 404)
    const category = await Category.findOne({ locale })
    if (!category) {
      throw new CustomError(`Category not found for locale: ${locale}`, 404)
    }
    const serverDate = new Date(category.lastUpdated)
    const clientDate = new Date(lastUpdated)
    if (clientDate.getTime() < serverDate.getTime()) {
      throw new CustomError(`Client data is outdated`, 409)
    }
    category.lastUpdated = now
    category.data = data
    category.save()
    logger.info(`Updated category ${locale}`)
  } catch (err) {
    logger.error(`Error updating category: ${err.message}`)
    res.status(err.httpCode || 500).json({
      message: 'Error updating category. See error field for detail',
      error: err.message
    })
  }

  /* if everything ok, we do rest of languages */
  /* now we mergeDeep rest of languages */
  languages.filter(language => language !== locale).forEach(async locale => {
    try {
      let category = await Category.findOne({ locale })
      // new language?
      if (!category) category = new Category({ locale, data: {} })
      // we don't check lastupdate values
      category.lastUpdated = now
      category.data = merge(data, category.data)
      // in case of delete, we remove extra keys:
      await category.save()
      logger.info(`Updated category ${locale}`)
    } catch (err) {
      logger.error(`Error updating category ${locale}: ${err.message}`)
      // as main locale was ok, we continue with rest of languages
    }
  })
  res.json({ lastUpdated: now })
}

const remove = async (req, res) => {
  const { _id, lastUpdated, locale, data, item } = req.body
  logger.debug(`Removing category ${item} from all locales`)
  const now = Date.now()
  try {
    if (!ObjectID.isValid(_id)) throw new CustomError(`Invalid id: ${_id}`, 404)
    const category = await Category.findOne({ locale })
    if (!category) {
      throw new CustomError(`Category not found for locale: ${locale}`, 404)
    }
    const serverDate = new Date(category.lastUpdated)
    const clientDate = new Date(lastUpdated)
    if (clientDate.getTime() < serverDate.getTime()) {
      throw new CustomError(`Client data is outdated`, 409)
    }
    category.lastUpdated = now
    category.data = data
    category.save()
    logger.info(`Removed category ${item} from ${locale}`)
  } catch (err) {
    logger.error(`Error removing category ${item}: ${err.message}`)
    return res.status(err.httpCode || 500).json({
      message: `Error removing category ${item}. See error field for detail`,
      error: err.message
    })
  }

  /* if everything ok, we do rest of languages */
  /* now we mergeDeep rest of languages */
  languages.filter(language => language !== locale).forEach(async locale => {
    try {
      let category = await Category.findOne({ locale })
      // new language?
      if (!category) category = new Category({ locale, data: {} })
      // we sync categories just in case...
      category.data = merge(data, category.data)
      category.lastUpdated = now
      removeKeys(category.data, item)
      // in case of delete, we remove extra keys:
      await category.save()
      logger.info(`Remove category ${item} from ${locale}`)
    } catch (err) {
      // as main locale was ok, we continue with rest of languages
      logger.error(
        `Error removing category ${item} from ${locale}: ${err.message}`
      )
    }
  })
  res.json({ lastUpdated: now })
}

module.exports = {
  update,
  add,
  remove,
  get
}
