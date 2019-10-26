"use strict";

var mongoose = require('mongoose');

var databaseUrl = 'mongodb://mongodb/arasaac';

var logger = require('./utils/logger');

mongoose.Promise = global.Promise;
mongoose.connect(databaseUrl, {
  useNewUrlParser: true
}).then(function () {
  logger.info("Connected to database: ".concat(databaseUrl));
}, function (err) {
  logger.error("Database connection error: ".concat(err));
});
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
process.on('SIGINT', function () {
  return mongoose.connection.close(function () {
    console.log('Finished App and disconnected from database');
    process.exit(0);
  });
});