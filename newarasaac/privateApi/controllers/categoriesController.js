const Category = require('../models/Category')
const { ObjectID } = require('mongodb')
const { merge } = require('lodash')
const logger = require('../utils/logger')
const languages = require('../utils/languages')

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
  update
}
