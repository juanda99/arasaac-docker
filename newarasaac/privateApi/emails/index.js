const nodemailer = require('nodemailer')
const path = require('path')
const Email = require('email-templates')
const logger = require('../utils/logger')
const CustomError = require('../utils/CustomError')
const { ARASAAC_URL, DEV_ARASAAC_URL } = require('../utils/constants')
const languages = require('../utils/languages')
const {
  EMAIL_FROM,
  EMAIL_USER,
  EMAIL_PASSWORD,
  EMAIL_SMTP,
  NODE_ENV
} = process.env

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

// TODO: Iconos redes sociales más pequeños, centrado al medio, icono red social también con el mismo estilo black&white. Quitar copyright y poner frase del tipo
// Arasaac es una marca registrada por.....

// const transport = nodemailer.createTransport({
//   host: EMAIL_SMTP,
//   port: 587,
//   secure: false, // upgrade later with STARTTLS
//   auth: {
//     user: EMAIL_USER,
//     pass: EMAIL_PASSWORD
//   }
// })

// remove val, it does not work, we will use ca
const locales = languages.filter(language => language !== 'val')
const email = new Email({
  message: {
    from: EMAIL_FROM
  },
  // uncomment below to send emails in development/test env:
  send: true,
  transport,
  i18n: {
    locales,
    directory: path.resolve(__dirname, 'locales')
  }
})

const contactEmail = (userEmail) => new Email({
  message: {
    from: EMAIL_FROM,
    replyTo: userEmail
  },
  // uncomment below to send emails in development/test env:
  send: true,
  transport
})

const sendContactMail = data =>
  new Promise((resolve, reject) => {
    return contactEmail(data.email)
      .send({
        template: 'tplContact',
        message: {
          to: 'arasaac@gmail.com'
        },
        locals: {
          name: data.name,
          email: data.email,
          message: data.message
        },
        htmlToText: true
      })
      .then(() => {
        logger.debug(`Sent contact email from user ${data.email}`)
        resolve()
      })
      .catch(error => {
        reject(
          new CustomError(
            `Error sending contact email from user ${data.email}: ${error}`,
            500
          )
        )
      })
  })

const sendWelcomeMail = user =>
  new Promise((resolve, reject) => {
    var tokenUrl = ''
    var direction = 'ltr'
    if (NODE_ENV === 'development') {
      tokenUrl = `${DEV_ARASAAC_URL}/activate/${user.verifyToken}`
    } else tokenUrl = `${ARASAAC_URL}/activate/${user.verifyToken}`

    if (user.locale === 'val') user.locale = 'ca'
    if (user.locale === 'ar' || user.locale === 'he') {
      direction = 'rtl'
    }
    return email
      .send({
        template: 'tplWelcome',
        message: {
          to: user.email
        },
        locals: {
          name: user.name,
          direction,
          // if locale does not exist... it uses en by default
          locale: user.locale,
          tokenUrl
        },
        htmlToText: true
      })
      .then(() => {
        logger.debug(`Sent welcome email OK to ${user.email}`)
        resolve()
      })
      .catch(error => {
        reject(
          new CustomError(
            `Error sending welcome email to ${user.email}: ${error}`,
            500
          )
        )
      })
  })

const sendPasswordRecoveryMail = (user, password) =>
  new Promise((resolve, reject) => {
    var accessUrl = ''
    var direction = 'ltr'
    if (NODE_ENV === 'development') {
      accessUrl = `${DEV_ARASAAC_URL}/signin`
    } else accessUrl = `${ARASAAC_URL}/signin`
    if (user.locale === 'val') user.locale = 'ca'
    if (user.locale === 'ar' || user.locale === 'he') {
      direction = 'rtl'
    }
    return email
      .send({
        template: 'tplPasswordRecovery',
        message: {
          to: user.email
        },
        locals: {
          name: user.name,
          direction,
          // if locale does not exist... it uses en by default
          locale: user.locale,
          accessUrl,
          password
        },
        htmlToText: true
      })
      .then(() => {
        logger.debug(`Sent password recovery email OK to ${user.email}`)
        resolve()
      })
      .catch(error => {
        reject(
          new CustomError(
            `Error sending password recovery email OK to ${
            user.email
            }: ${error}`,
            500
          )
        )
      })
  })

module.exports = {
  sendWelcomeMail,
  sendPasswordRecoveryMail,
  sendContactMail
}
