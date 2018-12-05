const User = require('../models/User')
const mongoose = require('mongoose')
const nev = require('email-verification')(mongoose)
const bcrypt = require('bcryptjs')
const config = require('../config')

module.exports = () => {
  const locale = 'es'
  const myHasher = (password, tempUserData, insertTempUser, callback) => {
    bcrypt.genSalt(8, (err, salt) => {
      bcrypt.hash(password, salt, (err, hash) =>
        insertTempUser(hash, tempUserData, callback)
      )
    })
  }
  /* email messages, we may change them depending on locale */
  let subject = 'Please confirm account'
  let html =
    'Click the following link to confirm your account:</p><p>${URL}</p>'
  let text =
    'Please confirm your account by clicking the following link: ${URL}'
  if (locale === 'es') {
    subject = 'Por favor, confirma tu cuenta'
    html =
      'Pulsa el enlace siguiente para confirmar tu cuenta:</p><p>${URL}</p>'
    text = 'Por favor, confirma tu cuenta pulsando el enlace siguiente: ${URL}'
  }

  console.log(process.env)

  nev.configure(
    {
      verificationURL: process.env.EMAIL_VERIFICATION_URL,
      URLLength: 16,
      // mongo-stuff
      persistentUserModel: User,
      emailFieldName: 'email',
      passwordFieldName: 'password',
      URLFieldName: 'GENERATED_VERIFYING_URL',
      expirationTime: 86400, // 1 day
      // emailing options
      transportOptions: {
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      },
      verifyMailOptions: {
        from: process.env.EMAIL_FROM,
        subject,
        html,
        text
      },
      shouldSendConfirmation: true,
      confirmMailOptions: {
        from: process.env.EMAIL_FROM,
        subject: 'Successfully verified!',
        html: '<p>Your account has been successfully verified.</p>',
        text: 'Your account has been successfully verified.'
      },
      hashingFunction: myHasher
    },
    (err, options) => {
      if (err) {
        console.log(err)
        return
      }
      console.log(`configured: ${typeof options === 'object'}`)
    }
  )

  nev.generateTempUserModel(User, (err, tempUserModel) => {
    if (err) {
      console.log(err)
      return
    }
    console.log(
      `generated temp user model: ${typeof tempUserModel === 'function'}`
    )
  })
  return nev
}
