const { createLogger, format, transports } = require('winston')
const { combine, timestamp, printf, colorize } = format

// log configuration
const myFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`
})

const logger = createLogger({
  format: combine(timestamp(), myFormat),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new transports.File({
      filename: 'error.log',
      level: 'error'
    }),
    new transports.File({
      filename: 'svgwatcher.log',
      level: 'info'
    }),
    new transports.Console({
      level: 'debug',
      format: combine(colorize(), timestamp(), myFormat)
    })
  ]
})

// TODO: decide which logs go for production and development

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
// if (process.env.NODE_ENV !== 'production') {
//   logger.add(
//     new transports.Console({
//       level: 'debug',
//       format: combine(colorize(), timestamp(), myFormat)
//     })
//   )
// }

process.on('uncaughtException', function (err) {
  logger.error(err.message)
})

module.exports = logger
