"use strict";

var _require = require('winston'),
    createLogger = _require.createLogger,
    format = _require.format,
    transports = _require.transports;

var combine = format.combine,
    timestamp = format.timestamp,
    printf = format.printf,
    colorize = format.colorize; // log configuration

var myFormat = printf(function (info) {
  return "".concat(info.timestamp, " ").concat(info.level, ": ").concat(info.message);
});
var logger = createLogger({
  format: combine(timestamp(), myFormat),
  transports: [new transports.Console({
    level: process.env.LOG_LEVEL,
    format: combine(colorize(), timestamp(), myFormat)
  })]
});
process.on('uncaughtException', function (err) {
  logger.error(err.message);
});
module.exports = logger;