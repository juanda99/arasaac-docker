const Category = require('../models/Category')
const { ObjectID } = require('mongodb')
const { merge } = require('lodash')
const jp = require('jsonpath')
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
  const { lastUpdated, locale, item, text, tags, keywords } = req.body
  const { role, targetLanguages } = req.user
  // if user is translator but locale is not in targetLanguages forbidden!
  logger.debug(`Updating category for locale ${locale}`)
  try {
    if (role === 'translator' && !targetLanguages.includes(locale)) {
      throw new CustomError(
        `Modifications forbidden for language ${locale}`,
        403
      )
    }
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
    const partialData = jp.value(category.data, `$..["${item}"]`)
    let tagsModified = false
    if (tags && !equalsArray(partialData.tags, tags)) {
      if (req.user.role !== 'admin') {
        throw new CustomError(`Not enough role`, 403)
      }
      tagsModified = true
      partialData.tags = tags
    }
    if (keywords) partialData.keywords = keywords
    partialData.text = text
    // nested json we need no notify mongoose about changes, othewise save has no effect
    category.markModified('data')
    category.save()

    /* we now update tags in all categories */
    if (tagsModified) {
      const categories = await Category.find({ locale: { $ne: locale } })
      categories.forEach(category => {
        const partialData = jp.value(category.data, `$..["${item}"]`)
        partialData.tags = tags
        category.markModified('data')
        category.save()
      })
    }
    res.json(category)
  } catch (err) {
    logger.error(`Error updating category: ${err.message}`)
    res.status(err.httpCode || 500).json({
      message: 'Error updating category. See error field for detail',
      error: err.message
    })
  }
}

const add = async (req, res) => {
  const { parentItem, data, locale, lastUpdated } = req.body
  logger.debug(
    `Add category for all locales. Merging data from locale: ${locale}`
  )
  // first we update lang
  const now = Date.now()
  let targetCategory
  try {
    targetCategory = await Category.findOne({ locale })
    if (!targetCategory) {
      throw new CustomError(`Category not found for locale: ${locale}`, 404)
    }
    const serverDate = new Date(targetCategory.lastUpdated)
    const clientDate = new Date(lastUpdated)
    if (clientDate.getTime() < serverDate.getTime()) {
      throw new CustomError(`Client data is outdated`, 409)
    }
    /* now we add new data */
    targetCategory.lastUpdated = now

    const parentData = jp.value(targetCategory.data, `$..["${parentItem}"]`)
    const key = data.key
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // removing accents and diacritics
      // .replace(/\s/g, '') // without blank spaces
      .toLowerCase()
    const keyExists = jp.value(targetCategory, `$..["${key}"]`)
    if (keyExists) throw new Error(`key ${key} already exists in category tree`)
    if (!parentData.children) parentData.children = {}
    // remove key from data
    delete data.key
    parentData.children[key] = data
    targetCategory.markModified('data')
    targetCategory.save()
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

      if (!category) {
        // new language?
        const newCategory = { data: targetCategory.data, locale }
        category = new Category(newCategory)
      } else {
        category.data = merge(targetCategory.data, category.data)
      }
      category.lastUpdated = now
      await category.save()
      logger.info(`Updated category ${locale}`)
    } catch (err) {
      logger.error(`Error updating category ${locale}: ${err.message}`)
      // as main locale was ok, we continue with rest of languages
    }
  })
  res.json({
    data: targetCategory.data,
    lastUpdated: targetCategory.lastUpdated,
    locale: targetCategory.locale
  })
}

const remove = async (req, res) => {
  const { lastUpdated, locale, item } = req.body
  logger.debug(`Removing category ${item} from all locales`)
  const now = Date.now()
  let targetCategory
  try {
    targetCategory = await Category.findOne({ locale })
    if (!targetCategory) {
      throw new CustomError(`Category not found for locale: ${locale}`, 404)
    }
    const serverDate = new Date(targetCategory.lastUpdated)
    const clientDate = new Date(lastUpdated)
    if (clientDate.getTime() < serverDate.getTime()) {
      throw new CustomError(`Client data is outdated`, 409)
    }
    targetCategory.lastUpdated = now
    removeKeys(targetCategory.data, item)
    targetCategory.markModified('data')
    targetCategory.save()
    logger.info(`Removed category ${item} from ${locale}`)
  } catch (err) {
    logger.error(`Error removing category ${item}: ${err.message}`)
    return res.status(err.httpCode || 500).json({
      message: `Error removing category ${item}. See error field for detail`,
      error: err.message
    })
  }
  /* if everything ok, we sync rest of languages */
  languages.filter(language => language !== locale).forEach(async locale => {
    try {
      let category = await Category.findOne({ locale })
      if (!category) {
        // new language?
        const newCategory = { data: targetCategory.data, locale }
        category = new Category(newCategory)
      } else {
        removeKeys(category.data, item)
      }
      category.lastUpdated = now
      await category.save()
      logger.info(`Remove category ${item} from ${locale}`)
    } catch (err) {
      // as main locale was ok, we continue with rest of languages
      logger.error(
        `Error removing category ${item} from ${locale}: ${err.message}`
      )
    }
  })
  res.json({
    data: targetCategory.data,
    lastUpdated: targetCategory.lastUpdated,
    locale: targetCategory.locale
  })
}

const equalsArray = (array1, array2) =>
  array1.length === array2.length &&
  array1.sort().every(function (value, index) {
    return value === array2.sort()[index]
  })

module.exports = {
  update,
  add,
  remove,
  get
}
