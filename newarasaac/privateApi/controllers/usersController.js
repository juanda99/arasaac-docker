const User = require('../models/User')
const { ObjectID } = require('mongodb')
const moment = require('moment')
const randomize = require('randomatic')
const { SHA256 } = require('crypto-js')
// TODO: use Joi or mongodb validation
// const Joi = require('joi')
const CustomError = require('../utils/CustomError')
const { objectToDotNotation } = require('../utils/mongo')
const { sendWelcomeMail, sendPasswordRecoveryMail } = require('../emails')
const logger = require('../utils/logger')

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

  // some fields should not be updated here:
  delete req.body._id
  delete req.body.password
  delete req.body.created
  delete req.body.lastLogin
  delete req.body.favorites

  console.log(req.body)
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
    })
    if (!user) throw new CustomError('USER_NOT_FOUND', 404)
    // else send modified doc:
    delete user.password
    delete user.idAuthor
    delete user.authToken
    delete user.google
    delete user.facebook
    delete user.favorites
    delete user.updated
    return res.status(200).json(user)
  } catch (err) {
    logger.error(`Error updating user: ${err.message}`)
    return res.status(err.httpCode || 500).json({
      message: 'Error updating user. See error field for detail',
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

const remove = (req, res) => {
  const id = req.swagger.params.id.value
  User.findByIdAndRemove(id, (err, users) => {
    if (err) {
      return res.status(404).json({
        message: `User not found. User Id: ${id}`
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
    logger.err(`Error getting data from all users: ${err.message}`)
    return res.status(500).json(err)
  }
}

const getAllByDate = async (req, res) => {
  const { date } = req.params
  logger.debug(`Getting data from all users updated after ${date}`)
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
  logger.debug(`Getting data for user with _id: ${id}`)
  try {
    if (!ObjectID.isValid(id)) {
      logger.debug(`Invalid id: ${id}`)
      return res.status(404).json([])
    }
    const user = await User.findOne(
      { _id: id },
      '-password -idAuthor -authToken -google -facebook'
    )
    if (!user) throw new CustomError('USER_NOT_FOUND', 404)
    return res.status(200).json(user)
  } catch (err) {
    logger.error(`Error getting data for user ${err.message}`)
    return res.status(err.httpCode || 500).json({
      message: 'Error getting data for user. See error field for detail',
      error: err.message
    })
  }
}

// const deleteFavorite = async (req, res) => {
//   const { id } = req.params
//   const { pictogram, tag } = req.body

//   try {
//     if (!ObjectID.isValid(id)) {
//       return res.status(404).json([])
//     }

//     let params = {}
//     if (tag) {
//       params.favorites = {}
//       params.favorites[tag] = pictogram
//     }
//     const dotNotated = objectToDotNotation(params)
//     const updatedUser = await User.findOneAndUpdate(
//       { _id: id },
//       { $pull: dotNotated },
//       { new: true }
//     )
//     return res.status(201).json({ updatedUser })
//   } catch (err) {
//     return res.status(500).json({
//       message: 'Error updating favorites. See error field for detail',
//       error: err
//     })
//   }
// }

const addFavorite = async (req, res) => {
  const { fileName, listName } = req.body
  const { id } = req.user

  try {
    const user = await User.findById(id)
    if (!user) {
      throw new CustomError(`USER_NOT_EXISTS`, 404)
    }
    if (!user.favorites) user.favorites = { defaultList: [] }
    if (!listName) user.favorites['defaultList'].push(fileName)
    else user.favorites[listName].push(fileName)
    await user.save()
    return res.status(204).json({ resultado: 'ok' })
  } catch (err) {
    return res.status(err.httpCode || 500).json({
      message: 'Error updating favorites.   See error field for detail',
      error: err
    })
  }
}

const removeFavorite = async (req, res) => {
  const { fileName, listName } = req.params
  const { id } = req.user

  try {
    const user = await User.findById(id)
    if (!user) {
      throw new CustomError(`USER_NOT_EXISTS`, 404)
    }
    if (!user.favorites) user.favorites = { defaultList: [] }
    if (!listName) user.favorites['defaultList'].pull(fileName)
    else user.favorites[listName].push(fileName)
    await user.save()
    return res.status(204).json({})
  } catch (err) {
    return res.status(err.httpCode || 500).json({
      message: 'Error removing favorite. See error field for detail',
      error: err
    })
  }
}

const resetPassword = async (req, res) => {
  const email = req.body.username
  logger.debug(`Reset password to user with email: ${email}`)

  /* we generate passwordless token */
  const cleanPassword = randomize('Aa0', 8)
  const password = `${SHA256(cleanPassword)}`
  try {
    const user = await User.findOneAndUpdate(
      { email: email },
      { password, verifyToken: '', verifyDate: '' }
    )

    if (!user) {
      throw new CustomError(`USER_NOT_EXISTS`, 404)
    }
    logger.debug(`User ${email} reset password OK`)
    /* generate mail with info */
    await sendPasswordRecoveryMail(user, cleanPassword)
    return res.status(200).json({ _id: user._id })
  } catch (err) {
    logger.error(
      `Error resetting password for user with email ${email}: ${err.message}`
    )
    res.status(err.httpCode || 500).json({
      message: 'Error resetting password',
      error: err.message
    })
  }
}

// const createPasswordlessToken = async (req, res) => {
//   const { id } = req.params

//   try {
//     if (!ObjectID.isValid(id)) {
//       return res.status(404).json([])
//     }

//     /* we generate passwordless token */
//     const passwordlessToken = randomize('Aa0', 32)

//     await User.findOneAndUpdate({ _id: id }, { passwordlessToken })
//     /* generate mail with info */

//     return res.status(204).json()
//   } catch (err) {
//     return res.status(500).json({
//       message: 'Error generating passwordless token',
//       error: err
//     })
//   }
// }

module.exports = {
  create,
  update,
  remove,
  activate,
  getAll,
  getAllByDate,
  findOne,
  addFavorite,
  removeFavorite,
  resetPassword
}
