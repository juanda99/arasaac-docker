const User = require('../models/User')
const { ObjectID } = require('mongodb')
const { objectToDotNotation } = require('../utils/mongo')
const mailing = require('../mail')
const nev = mailing()

const create = (req, res) => {
  const user = new User(req.body)
  nev.createTempUser(user, (err, existingPersistentUser, newTempUser) => {
    if (err) {
      return res.status(500).json({
        message: err,
        err: 500
      })
    }
    // user already exists in persistent collection
    if (existingPersistentUser) {
      return res.status(409).json({
        message:
          'You have already signed up and confirmed your account. Did you forget your password?',
        err: 409
      })
    }
    console.log(newTempUser)
    // new user created
    if (newTempUser) {
      console.log(newTempUser)
      const URL = newTempUser[nev.options.URLFieldName]
      nev.sendVerificationEmail(newTempUser.email, URL, (err /* , info */) => {
        if (err) {
          console.log(err)
          return res.status(500).json({
            message: `ERROR: sending verification email FAILED`,
            err: 500
          })
        }

        return res.status(201).json({
          message:
            'An email has been sent to you. Please check it to verify your account.',
          _id: newTempUser._id
        })
      })
      // user already exists in temporary collection!
    } else {
      return res.status(403).json({
        message:
          'You have already signed up. Please check your email to verify your account.',
        err: 403
      })
    }
  })
}

const activate = (req, res) => {
  const url = req.params.code
  nev.confirmTempUser(url, (err, user) => {
    if (user) {
      nev.sendConfirmationEmail(user.email, (err, info) => {
        if (err) {
          return res.status(500).json({
            message: `ERROR: sending confirmation email FAILED ${info}`
          })
        }
        return res.status(201).json({
          message: 'User activated',
          _id: user._id,
          email: user.email,
          name: user.name,
          username: user.username,
          locale: user.locale
        })
      })
    }
    return res.status(404).json({
      message: 'ERROR: temporal user not found or expired'
    })
  })
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
    console.log(JSON.stringify(dotNotated, null, 4))

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

module.exports = {
  create,
  remove,
  activate,
  getAll,
  addFavorite,
  getFavorites,
  deleteFavorite,
  deleteFavoriteTag
}
