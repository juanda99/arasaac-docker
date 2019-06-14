const Category = require('../models/Category')
const { ObjectID } = require('mongodb')
const { merge } = require('lodash')
const logger = require('../utils/logger')
const languages = require('../utils/languages')

const get = async (req, res) => {
  const { locale, date } = req.params
  var clientDate
  if (date) {
    clientDate = new Date(date)
    logger.debug(
      `Getting category for locale ${locale} and date: ${clientDate}`
    )
  } else logger.debug(`Getting category for locale ${locale}`)
  try {
    const category = await Category.findOne({ locale: locale })
    if (!category) {
      logger.warn(`No categories found for locale ${locale}`)
      return res.status(404).json({}) // send http code 404!!!
    }
    logger.debug(`Server date: ${category.lastUpdated}`)
    logger.debug(`Client date: ${clientDate}`)
    console.log(category.lastUpdated === clientDate)
    console.log(typeof category.lastUpdated)
    console.log(typeof clientDate)
    if (clientDate && category.lastUpdated == clientDate) {
      logger.debug(
        `Category data for language ${locale} already in the client for date ${clientDate}`
      )
      return res.status(200).json({}) // send http code 404!!!
    }
    return res.json(category)
  } catch (err) {
    logger.error(
      `Error getting cateogry data for locale ${locale}: ${err.message}`
    )
    return res.status(500).json({
      message: `Error getting category data for locale ${locale}`,
      error: err.message
    })
  }
}

const update = async (req, res) => {
  const { _id, lastUpdated, locale } = req.body

  logger.debug(`Updating category for locale ${locale}`)

  try {
    if (!ObjectID.isValid(_id)) {
      logger.debug(`Invalid id: ${_id}`)
      return res.status(404).json({})
    }
    const category = Category.findOne({ _id: _id })
    if (category.lastUpdated !== lastUpdated) {
      return res.status(409).json({})
    }
    const now = Date.now()
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
