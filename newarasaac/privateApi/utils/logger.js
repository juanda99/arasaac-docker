const { createLogger, format, transports } = require('winston')
const { combine, timestamp, printf, colorize } = format

// log configuration
const myFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`
})

const logger = createLogger({
  format: combine(timestamp(), myFormat),
  transports: [
    new transports.Console({
      level: process.env.LOG_LEVEL,
      format: combine(colorize(), timestamp(), myFormat)
    })
  ]
})

process.on('uncaughtException', function (err) {
  logger.error(err.message)
  console.log(err)
})

module.exports = logger
