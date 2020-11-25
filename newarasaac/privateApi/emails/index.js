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

// const transport = nodemailer.createTransport({
//   // service: 'gmail',
//   auth: {
//     user: EMAIL_USER,
//     pass: EMAIL_PASSWORD
//   },
//   port: 465,
//   secure: true,
//   host: EMAIL_SMTP
// })

// TODO: Iconos redes sociales más pequeños, centrado al medio, icono red social también con el mismo estilo black&white. Quitar copyright y poner frase del tipo
// Arasaac es una marca registrada por.....

const transport = nodemailer.createTransport({
  host: EMAIL_SMTP,
  port: 587,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD
  },
  requireTLS: true,
  debug: true
})

// remove val and an, it does not work, we will use ca
const locales = languages.filter(language => language !== 'val' && language !== 'an')
const newEmail = new Email({
  message: {
    from: `${EMAIL_FROM} <${EMAIL_USER}>`,
  },
  // uncomment below to send emails in development/test env:
  send: true,
  transport,
  i18n: {
    locales,
    directory: path.resolve(__dirname, 'locales')
  }
})

const contactEmail = (userEmail, userName) => new Email({
  message: {
    /* change EMAIL_TO for EMAIL_USER for aragon.es: */
    from: `${userName} <${EMAIL_USER}>`,
    replyTo: userEmail
  },
  // uncomment below to send emails in development/test env:
  send: true,
  transport,
  i18n: {
    locales,
    directory: path.resolve(__dirname, 'locales')
  }
})

const sendContactMail = data =>
  new Promise((resolve, reject) => {
    return contactEmail(data.email, data.name)
      .send({
        template: 'tplContact',
        message: {
          to: 'arasaac@aragon.es'
        },
        locals: {
          name: data.name,
          subject: data.subject,
          email: data.email,
          message: data.message
        }
        // htmlToText: true
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
    if (NODE_ENV === 'development') {
      tokenUrl = `${DEV_ARASAAC_URL}/activate/${user.verifyToken}`
    } else tokenUrl = `${ARASAAC_URL}/activate/${user.verifyToken}`

    if (user.locale === 'val') user.locale = 'ca'
    else if (user.locale === 'an') user.locale = 'es'
    const direction = getDirection(user.locale)
    return newEmail
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
    if (NODE_ENV === 'development') {
      accessUrl = `${DEV_ARASAAC_URL}/signin`
    } else accessUrl = `${ARASAAC_URL}/signin`
    const direction = getDirection(user.locale)
    if (user.locale === 'val') user.locale = 'ca'
    else if (user.locale === 'an') user.locale = 'es'
    return newEmail
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
            `Error sending password recovery email OK to ${user.email
            }: ${error}`,
            500
          )
        )
      })
  })

/* we  use contactEmail as it's a  message for us, and maybe we would like to reply to
the author off the material */
const sendNewMaterialEmail = data =>
  new Promise((resolve, reject) => {
    var materialUrl
    if (NODE_ENV === 'development') {
      materialUrl = `${DEV_ARASAAC_URL}/materials/es/${data.idMaterial}`
    } else materialUrl = `${ARASAAC_URL}/materials/es/${data.idMaterial}`
    return contactEmail(data.emailAuthors.email, data.emailAuthors.name)
      .send({
        template: 'tplNewMaterial',
        message: {
          to: 'arasaac@aragon.es'

        },
        locals: {
          name: data.emailAuthors.name,
          locale: 'es',
          materialUrl
        }
        // htmlToText: true
      })
      .then(() => {
        logger.debug(`Sent new material email from user ${data.emailAuthors.email}`)
        resolve()
      })
      .catch(error => {
        reject(
          new CustomError(
            `Error sending contact email from user ${data.emailAuthors.email}: ${error}`,
            500
          )
        )
      })
  })



const sendTranslationEmail = data =>
  new Promise((resolve, reject) => {
    const { idMaterial, name, email, targetLanguage } = data
    var materialUrl
    if (NODE_ENV === 'development') {
      materialUrl = `${DEV_ARASAAC_URL}/materials/es/${idMaterial}`
    } else materialUrl = `${ARASAAC_URL}/materials/es/${idMaterial}`
    return contactEmail(email, name)
      .send({
        template: 'tplTranslation',
        message: {
          to: 'arasaac@aragon.es'

        },
        locals: {
          name,
          locale: 'es',
          materialUrl,
          targetLanguage
        }
        // htmlToText: true
      })
      .then(() => {
        logger.debug(`Sent new material email from user ${email}`)
        resolve()
      })
      .catch(error => {
        logger.error(`Error sending contact email from user ${email}: ${error}`)
        reject(
          new CustomError(
            `Error sending contact email from user ${email}: ${error}`,
            500
          )
        )
      })
  })


const sendPublishedMaterialEmail = data =>
  new Promise((resolve, reject) => {
    const { idMaterial, name, email, locale } = data
    var materialUrl, userLocale
    const direction = getDirection(locale)
    if (user.locale === 'val') userLocale = 'ca'
    else if (user.locale === 'an') userLocale = 'es'
    else userLocale = locale
    if (NODE_ENV === 'development') {
      materialUrl = `${DEV_ARASAAC_URL}/materials/es/${idMaterial}`
    } else materialUrl = `${ARASAAC_URL}/materials/es/${idMaterial}`
    return newEmail
      .send({
        template: 'tplPublishedMaterial',
        message: {
          to: email
        },
        locals: {
          name,
          locale: userLocale,
          direction,
          materialUrl
        }
        // htmlToText: true
      })
      .then(() => {
        logger.debug(`Sent new material email from user ${email}`)
        resolve()
      })
      .catch(error => {
        logger.error(`Error sending contact email from user ${email}: ${error}`)
        reject(
          new CustomError(
            `Error sending contact email from user ${email}: ${error}`,
            500
          )
        )
      })
  })


const getDirection = (locale) => (locale === 'ar' || locale === 'he') ? 'rtl' : 'ltr'

module.exports = {
  sendWelcomeMail,
  sendPasswordRecoveryMail,
  sendContactMail,
  sendNewMaterialEmail,
  sendTranslationEmail,
  sendPublishedMaterialEmail
}
