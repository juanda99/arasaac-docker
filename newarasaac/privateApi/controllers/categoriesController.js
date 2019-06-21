const Category = require('../models/Category')
const { ObjectID } = require('mongodb')
const { merge } = require('lodash')
const logger = require('../utils/logger')
const languages = require('../utils/languages')
const CustomError = require('../utils/CustomError')
const get = async (req, res) => {
  const { locale, lastUpdated } = req.params
  if (lastUpdated) {
    logger.debug(
      `Getting category for locale ${locale} if updated after: ${lastUpdated}`
    )
  } else logger.debug(`Getting category for data locale ${locale}`)
  try {
    const category = await Category.findOne({ locale: locale })
    if (!category) {
      throw new CustomError(`No categories found for locale ${locale}`, 404)
    }
    if (lastUpdated) {
      const serverDate = new Date(category.lastUpdated)
      const clientDate = new Date(lastUpdated)
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

  console.log(req.body)

  logger.debug(`Updating category for locale ${locale}`)

  try {
    if (!ObjectID.isValid(_id)) throw new CustomError(`Invalid id: ${_id}`, 404)
    const category = await Category.findById(_id)
    console.log(`category: ${category}`)
    if (!category) throw new CustomError(`Category id not found: ${_id}`, 404)
    const serverDate = new Date(category.lastUpdated)
    const clientDate = new Date(lastUpdated)
    console.log(`ClientDate: ${clientDate}`)
    console.log(`ServerDate: ${serverDate}`)
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

const updateAll = async (req, res) => {
  const { _id, lastUpdated, data, locale } = req.body

  logger.debug(
    `Updating category for all locales. Merging data from locale: ${locale}`
  )

  // first we update lang
  const now = Date.now()
  try {
    if (!ObjectID.isValid(_id)) {
      logger.debug(`Invalid id: ${_id}`)
      return res.status(404).json({})
    }
    const category = Category.findOne({ _id: _id })
    if (category.lastUpdated !== lastUpdated) {
      return res.status(409).json({})
    }
    category.lastUpdated = now
    category.save()
    res.json({ lastUpdated: now })
  } catch (err) {
    logger.error(`Error updating category: ${err.message}`)
    res.status(err.httpCode || 500).json({
      message: 'Error updating category. See error field for detail',
      error: err.message
    })
  }

  languages.filter(language => language !== locale).forEach(language => {
    try {
      if (!ObjectID.isValid(_id)) {
        logger.debug(`Invalid id: ${_id}`)
        return res.status(404).json({})
      }
      const category = Category.findOne({ locale: language })
      // we don't check lastupdate values
      category.lastUpdated = now
      category.data = merge(category.data, data)
      category.save()
    } catch (err) {
      logger.error(`Error updating user: ${err.message}`)
      res.status(err.httpCode || 500).json({
        message: 'Error updating category. See error field for detail',
        error: err.message
      })
    }
  })
  res.json({ lastUpdated: now })
}

module.exports = {
  update,
  updateAll,
  get
}
