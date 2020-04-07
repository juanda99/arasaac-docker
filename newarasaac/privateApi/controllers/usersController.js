const User = require('../models/User')
const { ObjectID } = require('mongodb')
const moment = require('moment')
const randomize = require('randomatic')
const { SHA256 } = require('crypto-js')
const tar = require('tar')
const fs = require('fs-extra')
// TODO: use Joi or mongodb validation
// const Joi = require('joi')
const CustomError = require('../utils/CustomError')
const path = require('path')
const { sendWelcomeMail, sendPasswordRecoveryMail, sendContactMail } = require('../emails')
const logger = require('../utils/logger')
const USER_NOT_EXISTS = 'USER_NOT_EXISTS'
const USER_NOT_FOUND = 'USER_NOT_FOUND'
const { IMAGE_DIR } = require('../utils/constants')

const create = async (req, res) => {
  const {
    name,
    email,
    provider,
    locale,
    password,
    url,
    company,
    role,
    targetLanguages
  } = req.body
  const userData = {
    name,
    email,
    provider,
    locale,
    password,
    url,
    company,
    role,
    targetLanguages
  }

  logger.debug(`Creating user with data: ${JSON.stringify(userData)}`)
  try {
    let user = await User.findOne({ email })
    if (user) {
      // it can be activated or not
      if (user.isVerified) throw new CustomError('ALREADY_USER', 409)
      // send again the email, because it may be lost, update the password
      // throw new CustomError(`NOT_ACTIVATED_USER`, 403)
      user.password = userData.password
      user.name = userData.name
      user.url = userData.url
      user.company = userData.company
      const savedUser = await user.save()
      logger.debug(
        `Updated user not activated with data: ${JSON.stringify(savedUser)}`
      )
      res.status(201).json({
        message:
          'An email has been sent to you. Please check it to verify your account.',
        _id: savedUser._id
      })
    }
    user = new User(userData)
    const savedUser = await user.save()
    logger.debug(`Created user with data: ${JSON.stringify(savedUser)}`)
    await sendWelcomeMail(user)

    // else send verification email based on its locale
    return res.status(201).json({
      message:
        'An email has been sent to you. Please check it to verify your account.',
      _id: savedUser._id
    })
  } catch (err) {
    logger.error(`Error creating user: ${err.message}`)
    return res.status(err.httpCode || 500).json({
      message: 'Error creating user. See error field for detail',
      error: err.message
    })
  }
}

const update = async (req, res) => {
  const { id } = req.params
  /* prevent changing role by not admin user: */
  if (req.user.role !== 'admin') delete req.body.role

  // some fields should not be updated here:
  delete req.body._id
  delete req.body.password
  delete req.body.created
  delete req.body.lastLogin
  delete req.body.favorites

  logger.debug(
    `Updating user _id: ${id} with data: ${JSON.stringify(req.body)}`
  )
  try {
    if (!ObjectID.isValid(id)) {
      logger.debug(`Invalid id: ${id}`)
      return res.status(404).json({})
    }
    // Updated at most one doc, `response.modifiedCount` contains the number
    // of docs that MongoDB updated
    const user = await User.findOneAndUpdate({ _id: id }, req.body, {
      new: true
    }).lean()
    if (!user) throw new CustomError(USER_NOT_FOUND, 404)
    // else send modified doc:
    delete user.password
    delete user._id
    delete user.favorites
    delete user.__v
    delete user.google
    delete user.facebook
    return res.status(200).json(user)
  } catch (err) {
    logger.error(`Error updating user: ${err.message}`)
    return res.status(err.httpCode || 500).json({
      message: 'Error updating user. See error field for detail',
      error: err.message
    })
  }
}

const getUserByEmail = async (req, res) => {
  const { email } = req.params
  /* prevent changing role by not admin user: */
  try {
    const user = await User.findOne({ email }, { name: 1, email: 1, url: 1, company: 1, facebook: 1, google: 1, pictureProvider: 1 })
    if (!user) throw new CustomError(USER_NOT_FOUND, 404)
    return res.status(200).json(user)
  } catch (err) {
    logger.error(`Error getting user by email ${email}: ${err.message}`)
    return res.status(err.httpCode || 500).json({
      message: `Error getting user by email ${email}. See error field for detail`,
      error: err.message
    })
  }
}

const activate = async (req, res) => {
  const verifyToken = req.params.code
  logger.debug(`Activating user with verifyToken: ${verifyToken}`)
  try {
    const user = await User.findOne({ verifyToken })
    if (!user) {
      logger.debug(`No user with token: ${verifyToken}`)
      throw new CustomError('INVALID_CODE', 400)
    }
    const tokenDate = moment(user.verifyDate)
    const actualDate = moment()
    const EXPIRY_TIME = 1440 // minutes in one day
    if (actualDate.diff(tokenDate, 'minutes') > EXPIRY_TIME) {
      logger.debug(`Expired token: ${verifyToken} generated ${tokenDate}`)
      await sendWelcomeMail(user)
      throw new CustomError('EXPIRED_CODE', 400)
    }
    user.verifyToken = ''
    user.verifyDate = ''
    user.active = true
    user.updated = new Date()
    user.save()
    logger.debug(`User ${user._id} / ${user.email} activated`)
    return res.status(200).json({
      message: 'User account verified.',
      _id: user._id
    })
  } catch (err) {
    logger.error(`Error activating user: ${err.message}`)
    return res.status(err.httpCode || 500).json({
      message: 'Error activating user. See error field for detail',
      error: err.message
    })
  }
}

const changePassword = async (req, res) => {
  const { id } = req.user
  const { password } = req.body
  console.log(req.user)
  logger.debug(`EXEC changePassword for user with id: ${id}`)
  try {
    if (!ObjectID.isValid(id)) {
      logger.debug(`Invalid id: ${id}`)
      throw new CustomError('NOT FOUND', 404)
    }
    const user = await User.findOne({ _id: id })
    if (!user) {
      logger.debug(`ERROR: No user found with id: ${id}`)
      throw new CustomError('NOT FOUND', 404)
    }
    user.password = `${SHA256(password)}`
    user.save()
    logger.debug(`DONE changePassword for user with id: ${id} `)
    return res.status(200).json({
      message: 'User password changed',
      _id: user._id
    })
  } catch (err) {
    logger.error(`ERROR changePassword for user with id ${id}:  ${err.message} `)
    return res.status(err.httpCode || 500).json({
      message: `Error changing password to user with id ${id}.See error field for detail`,
      error: err.message
    })
  }
}

const remove = (req, res) => {
  const id = req.swagger.params.id.value
  User.findByIdAndRemove(id, (err, users) => {
    if (err) {
      return res.status(404).json({
        message: `User not found.User Id: ${id} `
      })
    }
    return res.status(200).json(users)
  })
}

const getAll = async (req, res) => {
  logger.debug(`Getting data from all users`)
  try {
    const users = await User.find(
      {},
      '-password -idAuthor -authToken -google -facebook -favorites'
    )
    return res.status(200).json(users)
  } catch (err) {
    logger.error(`Error getting data from all users: ${err.message} `)
    return res.status(500).json(err)
  }
}

const getAllByDate = async (req, res) => {
  const { date } = req.params
  logger.debug(`Getting data from all users updated after ${date} `)
  const query = date ? { updated: { $gte: date } } : {}
  try {
    const users = await User.find(
      query,
      '-password -idAuthor -authToken -google -facebook -favorites'
    )
    return res.status(200).json(users)
  } catch (err) {
    return res.status(500).json(err)
  }
}

const findOne = async (req, res) => {
  const { id } = req.params
  logger.debug(`Getting data for user with _id: ${id} `)
  try {
    if (!ObjectID.isValid(id)) {
      logger.debug(`Invalid id: ${id} `)
      return res.status(404).json([])
    }
    const user = await User.findOne(
      { _id: id },
      '-password -idAuthor -authToken -google -facebook'
    )
    if (!user) throw new CustomError(USER_NOT_FOUND, 404)
    return res.status(200).json(user)
  } catch (err) {
    logger.error(`Error getting data for user ${err.message}`)
    return res.status(err.httpCode || 500).json({
      message: 'Error getting data for user. See error field for detail',
      error: err.message
    })
  }
}

const addFavorite = async (req, res) => {
  const { fileName, listName } = req.body
  const { id } = req.user
  const now = Date.now()
  logger.debug(
    `EXEC addFavorite for user ${id}, listName ${listName} and file ${fileName} `
  )
  try {
    const user = await User.findById(id)
    if (!user) {
      throw new CustomError(USER_NOT_EXISTS, 404)
    }
    if (!user.favorites) user.favorites = { defaultList: [] }
    if (!listName) user.favorites['defaultList'].push(fileName)
    else user.favorites[listName].push(fileName)
    user.markModified('favorites')
    user.updated = now
    await user.save()
    logger.debug(
      `DONE addFavorite for user ${id}, listName ${listName} and file ${fileName} `
    )
    return res.status(204).json({ resultado: 'ok' })
  } catch (err) {
    logger.debug(
      `ERROR addFavorite for user ${id}, listName ${listName} and file ${fileName}: ${err} `
    )
    return res.status(err.httpCode || 500).json({
      message: 'Error updating favorites.   See error field for detail',
      error: err
    })
  }
}

const deleteFavorite = async (req, res) => {
  const { fileName, listName } = req.body
  const { id } = req.user
  const now = Date.now()
  logger.debug(
    `EXEC deleteFavorite for user ${id}, listName ${listName} and file ${fileName} `
  )

  try {
    const user = await User.findById(id)
    if (!user) {
      throw new CustomError(USER_NOT_EXISTS, 404)
    }
    if (!user.favorites) user.favorites = { defaultList: [] }
    else {
      const index = user.favorites[listName].indexOf(fileName)
      if (index !== -1) {
        user.favorites[listName].splice(
          user.favorites[listName].indexOf(fileName),
          1
        )
        user.markModified('favorites')
        user.updated = now
        await user.save()
        logger.debug(
          `DONE deleteFavorite for user ${id}, listName ${listName} and file ${fileName} `
        )
      } else {
        logger.debug(
          `NOT DONE deleteFavorite for user ${id}, listName ${listName} and file ${fileName}: File not found`
        )
      }
    }
    return res.status(204).json({})
  } catch (err) {
    logger.debug(
      `ERROR deleteFavorite for user ${id}, listName ${listName} and file ${fileName}: ${err} `
    )
    return res.status(err.httpCode || 500).json({
      message: 'Error removing favorite. See error field for detail',
      error: err
    })
  }
}

const resetPassword = async (req, res) => {
  const email = req.body.username
  logger.debug(`Reset password to user with email: ${email} `)

  /* we generate passwordless token */
  const cleanPassword = randomize('Aa0', 8)
  const password = `${SHA256(cleanPassword)}`
  try {
    const user = await User.findOneAndUpdate(
      { email: email },
      { password, verifyToken: '', verifyDate: '' }
    )

    if (!user) {
      throw new CustomError(USER_NOT_EXISTS, 404)
    }
    logger.debug(`User ${email} reset password OK`)
    /* generate mail with info */
    await sendPasswordRecoveryMail(user, cleanPassword)
    return res.status(200).json({ _id: user._id })
  } catch (err) {
    logger.error(
      `Error resetting password for user with email ${email}: ${err.message} `
    )
    res.status(err.httpCode || 500).json({
      message: 'Error resetting password',
      error: err.message
    })
  }
}

const sendContactForm = async (req, res) => {
  const _id = req.params._id
  const data = req.body
  logger.debug(`EXEC contact with data: ${JSON.stringify(data)} and user ${_id} `)

  try {
    // const user = await User.findOneAndUpdate(
    //   { email: email },
    //   { password, verifyToken: '', verifyDate: '' }
    // )

    // if (!user) {
    //   throw new CustomError(USER_NOT_EXISTS, 404)
    // }
    // logger.debug(`User ${ email } reset password OK`)
    // /* generate mail with info */
    await sendContactMail(data)
    return res.status(200).json({})
  } catch (err) {
    logger.error(
      `Error sending contact form for user with data ${JSON.stringify(data)}: ${err.message} `
    )
    res.status(err.httpCode || 500).json({
      message: 'Error sending contact forms',
      error: err.message
    })
  }
}

const addFavoriteList = async (req, res) => {
  const { listName } = req.params
  const { id } = req.user
  const now = Date.now()
  logger.debug(`EXEC addFavoriteList for user ${id} and listName ${listName} `)
  try {
    const user = await User.findById(id)
    if (!user) {
      throw new CustomError(USER_NOT_EXISTS, 404)
    }
    if (!user.favorites) user.favorites = { defaultList: [], listName: [] }
    else user.favorites[listName] = []
    user.markModified('favorites')
    user.updated = now
    await user.save()
    logger.debug(`DONE addFavoriteList for user ${id} and listName ${listName} `)
    return res.status(204).json()
  } catch (err) {
    logger.error(
      `ERROR addFavoriteList for user ${id} and listName ${listName}: ${err} `
    )
    return res.status(err.httpCode || 500).json({
      message: 'Error updating favorites.   See error field for detail',
      error: err
    })
  }
}

const deleteFavoriteList = async (req, res) => {
  const { listName } = req.params
  const { id } = req.user
  const now = Date.now()
  logger.debug(
    `EXEC deleteFavoriteList for user ${id} and listName ${listName} `
  )
  try {
    const user = await User.findById(id)
    if (!user) {
      throw new CustomError(USER_NOT_EXISTS, 404)
    }
    delete user.favorites[listName]
    user.markModified('favorites')
    user.updated = now
    await user.save()
    logger.debug(
      `DONE deleteFavoriteList for user ${id} and listName ${listName} `
    )
    return res.status(204).json()
  } catch (err) {
    logger.error(
      `ERROR deleteFavoriteList for user ${id} and listName ${listName}: ${err} `
    )
    return res.status(err.httpCode || 500).json({
      message: 'Error updating favorites.   See error field for detail',
      error: err
    })
  }
}

const renameFavoriteList = async (req, res) => {
  const { listName } = req.params
  const { newListName } = req.body
  const { id } = req.user
  const now = Date.now()
  logger.debug(
    `EXEC renameFavoriteList for user ${id} and listName ${listName} `
  )
  try {
    const user = await User.findById(id)
    if (!user) {
      throw new CustomError(USER_NOT_EXISTS, 404)
    }
    user.favorites[newListName] = user.favorites[listName]
    delete user.favorites[listName]
    user.markModified('favorites')
    user.updated = now
    await user.save()
    logger.debug(
      `DONE renameFavoriteList for user ${id} from listName ${listName} to ${newListName} `
    )
    return res.status(204).json()
  } catch (err) {
    logger.error(
      `ERROR renameFavoriteList for user ${id} and listName ${listName} to ${newListName}: ${err} `
    )
    return res.status(err.httpCode || 500).json({
      message: 'Error updating favorites.   See error field for detail',
      error: err
    })
  }
}

const downloadFavoriteList = async (req, res) => {
  const { listName, id } = req.params
  logger.debug(
    `EXEC downloadFavoriteList for user ${id} and listName ${listName} `
  )
  try {
    const user = await User.findById(id)
    if (!user) {
      throw new CustomError(USER_NOT_EXISTS, 404)
    }
    const pictograms = user.favorites[listName].map(pictogram => (
      {
        route: path.resolve(IMAGE_DIR, pictogram.toString(), `${pictogram}_500.png`),
        fileName: `${pictogram}.png`
      }
    ))
    const promises = pictograms.map(pictogram => fs.copy(pictogram.route, `/tmp/${listName}/${fileName}`))
    await Promise.all(promises)
    const files = pictograms.map(file => `${listName}/${file.fileName}`)
    const fileName = `${listName}.tar.gz`
    await tar.c(
      {
        gzip: true,
        file: fileName,
        cwd: '/tmp'
      }, files)

    logger.debug(
      `DONE downloadFavoriteList for user ${id} and listName ${listName}`
    )
    res.download(fileName)
  } catch (err) {
    logger.error(
      `ERROR downloadFavoriteList  for user ${id} and listName ${listName}: ${err.message} `
    )
    return res.status(err.httpCode || 500).json({
      message: 'Error downloadFavoriteList. See error field for detail',
      error: err.message
    })
  }
}

module.exports = {
  create,
  sendContactForm,
  changePassword,
  update,
  remove,
  activate,
  getAll,
  getAllByDate,
  findOne,
  addFavorite,
  deleteFavorite,
  resetPassword,
  addFavoriteList,
  deleteFavoriteList,
  renameFavoriteList,
  downloadFavoriteList,
  getUserByEmail
}
