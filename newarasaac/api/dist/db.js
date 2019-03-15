"use strict";

var _config = require("./config");

var _mongoose = _interopRequireDefault(require("mongoose"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_mongoose.default.Promise = global.Promise;

_mongoose.default.connect(_config.databaseUrl);

_mongoose.default.connection.on('connected', function () {
  return console.log('Connected to database: ' + _config.databaseUrl);
});

_mongoose.default.connection.on('error', function (err) {
  return console.log('Database connection error: ' + err);
});

_mongoose.default.connection.on('disconnected', function () {
  return console.log('Disconnected from database');
});

process.on('SIGINT', function () {
  return _mongoose.default.connection.close(function () {
    console.log('Finished App and disconnected from database');
    process.exit(0);
  });
});