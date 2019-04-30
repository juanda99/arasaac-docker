const nodemailer = require('nodemailer')
const path = require('path')
const Email = require('email-templates')
const logger = require('../utils/logger')
const CustomError = require('../utils/CustomError')
const { ARASAAC_URL, DEV_ARASAAC_URL } = require('../utils/constants')
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

const email = new Email({
  message: {
    from: EMAIL_FROM
  },
  // uncomment below to send emails in development/test env:
  send: true,
  transport,
  i18n: {
    locales: [
      'ar',
      'bg',
      'br',
      'ca',
      'de',
      'en',
      'es',
      'eu',
      'fr',
      'gl',
      'hr',
      'it',
      'pl',
      'pt',
      'ro',
      'ru',
      'zh'
    ],
    directory: path.resolve(__dirname, 'locales')
  }
})

const sendWelcomeMail = user =>
  new Promise((resolve, reject) => {
    var tokenUrl = ''
    if (NODE_ENV === 'development') {
      tokenUrl = `${DEV_ARASAAC_URL}/activate/${user.verifyToken}`
    } else tokenUrl = `${ARASAAC_URL}/activate/${user.verifyToken}`

    if (user.locale === 'val') user.locale = 'ca'
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
            `Error sending ewlcome email OK to ${user.email}: ${error}`,
            500
          )
        )
      })
  })

const sendPasswordRecoveryMail = (user, password) =>
  new Promise((resolve, reject) => {
    var accessUrl = ''
    if (NODE_ENV === 'development') {
      accessUrl = `${DEV_ARASAAC_URL}/signin`
    } else accessUrl = `${ARASAAC_URL}/signin`
    if (user.locale === 'val') user.locale = 'ca'
    return email
      .send({
        template: 'tplPasswordRecovery',
        message: {
          to: user.email
        },
        locals: {
          name: user.name,
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

// const sendPasswordlessMail = user =>
//   new Promise((resolve, reject) => {
//     return email
//       .send({
//         template: 'tplAccess',
//         message: {
//           to: user.email
//         },
//         locals: {
//           name: user.name,
//           // if locale does not exist... it uses en by default
//           locale: user.locale
//         },
//         htmlToText: true
//       })
//       .then(() => {
//         logger.debug(`Sent email OK`)
//         resolve()
//       })
//       .catch(error => {
//         reject(new CustomError(`Error sending email: ${error}`, 500))
//       })
//   })

module.exports = {
  sendWelcomeMail,
  sendPasswordRecoveryMail
}
