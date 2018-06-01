const User = require('../models/users')
const mailing = require('../mail')
const formidable = require('formidable')
const nev = mailing()

module.exports = {
  create: (req, res) => {
    const user = new User(req.body)
    console.log('++++++++++++++++++++')
    console.log(req.body)
    console.log('------------')

    nev.createTempUser(user, (err, existingPersistentUser, newTempUser) => {
      if (err) {
        return res.status(404).json({
          message: err
        })
      }
      // user already exists in persistent collection
      if (existingPersistentUser) {
        return res.status(409).json({
          message:
            'You have already signed up and confirmed your account. Did you forget your password?'
        })
      }
      console.log(newTempUser)
      // new user created
      if (newTempUser) {
        console.log(newTempUser)
        const URL = newTempUser[nev.options.URLFieldName]
        nev.sendVerificationEmail(
          newTempUser.email,
          URL,
          (err, info) => {
            if (err) {
              console.log(err)
              return res.status(500).json({
                message: `ERROR: sending verification email FAILED`,
                err
              })
            }
            else {
              return res.status(201).json({
                message:
                  'An email has been sent to you. Please check it to verify your account.',
                _id: newTempUser._id
              })
            }
          }
        )
      // user already exists in temporary collection!
      }
      else {
        return res.status(409).json({
          message:
            'You have already signed up. Please check your email to verify your account.'
        })
      }
    })
  },
  activate: (req, res) => {
    const url = req.swagger.params.url.value
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
      } else {
        return res.status(404).json({
          message: 'ERROR: temporal user not found or expired'
        })
      }
    })
  },
  delete: (req, res) => {
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
}
