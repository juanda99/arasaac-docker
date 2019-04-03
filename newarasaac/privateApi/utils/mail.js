var nodemailer = require('nodemailer')
const logger = require('./logger')
const CustomError = require('./CustomError')
const { EMAIL_FROM, EMAIL_USER, EMAIL_PASSWORD, EMAIL_SMTP } = process.env

// var transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: EMAIL_USER,
//     pass: EMAIL_PASSWORD
//   }
// })

const transporter = nodemailer.createTransport({
  host: EMAIL_SMTP,
  port: 587,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD
  }
})

const mailOptions = {
  from: 'arasaac@catedu.es', // sender address
  to: 'juandacorreo@gmail.com', // list of receivers
  subject: 'Prueba', // Subject line
  html: '<p>A ver....</p>' // plain text body
}

const sendMail = () =>
  new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (err, info) {
      logger.debug('Sending email')
      logger.debug(`User: ${EMAIL_USER}`)
      logger.debug(`Password: ${EMAIL_PASSWORD}`)
      if (err) reject(new CustomError(`Error sending email: ${err}`, 500))
      else {
        logger.debug(`Sent email OK`)
        resolve()
      }
    })
  })

module.exports = sendMail
