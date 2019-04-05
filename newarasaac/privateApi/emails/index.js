const nodemailer = require('nodemailer')
const path = require('path')
const Email = require('email-templates')
const logger = require('../utils/logger')
const CustomError = require('../utils/CustomError')
const { EMAIL_FROM, EMAIL_USER, EMAIL_PASSWORD, EMAIL_SMTP } = process.env

const transport = nodemailer.createTransport({
  // service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD
  },
  port: 465,
  secure: true,
  host: EMAIL_SMTP
})

// const transport = nodemailer.createTransport({
//   host: EMAIL_SMTP,
//   port: 587,
//   secure: false, // upgrade later with STARTTLS
//   auth: {
//     user: EMAIL_USER,
//     pass: EMAIL_PASSWORD
//   }
// })

const email = new Email({
  message: {
    from: EMAIL_FROM
  },
  // uncomment below to send emails in development/test env:
  send: true,
  transport,
  i18n: {
    locales: ['en', 'es'],
    directory: path.resolve(__dirname, 'locales')
  }
})

const sendWelcomeMail = user =>
  new Promise((resolve, reject) => {
    return email
      .send({
        template: 'tplWelcome',
        message: {
          to: user.email
        },
        locals: {
          name: user.name,
          // if locale does not exist... it uses en by default
          locale: user.locale,
          token: user.verifyToken
        },
        htmlToText: true
      })
      .then(() => {
        logger.debug(`Sent email OK`)
        resolve()
      })
      .catch(error => {
        reject(new CustomError(`Error sending email: ${error}`, 500))
      })
  })

const sendPasswordlessMail = user =>
  new Promise((resolve, reject) => {
    return email
      .send({
        template: 'tplAccess',
        message: {
          to: user.email
        },
        locals: {
          name: user.name,
          // if locale does not exist... it uses en by default
          locale: user.locale
        },
        htmlToText: true
      })
      .then(() => {
        logger.debug(`Sent email OK`)
        resolve()
      })
      .catch(error => {
        reject(new CustomError(`Error sending email: ${error}`, 500))
      })
  })

module.exports = {
  sendWelcomeMail,
  sendPasswordlessMail
}
