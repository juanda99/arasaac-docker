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
      throw new CustomError(`NOT_ACTIVATED_USER`, 403)
    }
    user = new User(userData)
    const savedUser = await user.save()
    logger.debug(`Create user with data: ${JSON.stringify(savedUser)}`)
    await sendWelcomeMail(user)

    // else send verification email based on its locale
    res.status(201).json({
      message:
        'An email has been sent to you. Please check it to verify your account.',
      _id: savedUser._id
    })
  } catch (err) {
    logger.error(`Error creating user: ${err.message}`)
    res.status(err.httpCode || 500).json({
      message: 'Error creating user. See error field for detail',
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
    user.save()
    logger.debug(`User ${user._id} / ${user.email} activated`)
    res.status(200).json({
      message: 'User account verified.',
      _id: user._id
    })
  } catch (err) {
    logger.error(`Error activating user: ${err.message}`)
    res.status(err.httpCode || 500).json({
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
  try {
    const users = await User.find(
      {},
      '-password -idAuthor -authToken -google -facebook'
    )
    return res.status(200).json(users)
  } catch (err) {
    return res.status(500).json(err)
  }
}

const deleteFavorite = async (req, res) => {
  const { id } = req.params
  const { pictogram, tag } = req.body

  try {
    if (!ObjectID.isValid(id)) {
      return res.status(404).json([])
    }

    let params = {}
    if (tag) {
      params.favorites = {}
      params.favorites[tag] = pictogram
    }
    const dotNotated = objectToDotNotation(params)
    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      { $pull: dotNotated },
      { new: true }
    )
    return res.status(201).json({ updatedUser })
  } catch (err) {
    return res.status(500).json({
      message: 'Error updating favorites. See error field for detail',
      error: err
    })
  }
}

const deleteFavoriteTag = async (req, res) => {}

const addFavorite = async (req, res) => {
  const { id } = req.params
  const { pictogram, tag } = req.body

  try {
    if (!ObjectID.isValid(id)) {
      return res.status(404).json([])
    }

    let params = {}
    if (tag) {
      params.favorites = {}
      params.favorites[tag] = pictogram
      params.favorites.all = pictogram
    }
    const dotNotated = objectToDotNotation(params)
    // console.log(JSON.stringify(dotNotated, null, 4))

    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      { $addToSet: dotNotated },
      { new: true }
    )
    return res.status(201).json({ updatedUser })
  } catch (err) {
    return res.status(500).json({
      message: 'Error updating favorites. See error field for detail',
      error: err
    })
  }
}

const getFavorites = async (req, res) => {
  const { id } = req.params

  try {
    if (!ObjectID.isValid(id)) {
      return res.status(404).json([])
    }
    const userFavorites = await User.find({ _id: id }, 'favorites -_id')
    if (userFavorites.length === 0) return res.status(404).json([]) // send http code 404!!!
    return res.json(userFavorites)
  } catch (err) {
    return res.status(500).json({
      message: 'Error searching user. See error field for detail',
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
  remove,
  activate,
  getAll,
  addFavorite,
  getFavorites,
  deleteFavorite,
  deleteFavoriteTag,
  resetPassword
}
