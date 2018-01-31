'use strict';

const mongoose = require('mongoose');
const databaseUrl = process.env.MONGO_URL || 'mongodb://mongodb/arasaac';
mongoose.connect(databaseUrl);
mongoose.connection.on('connected', () => console.log('Connected to database: ' + databaseUrl))
mongoose.connection.on('error',(err) => console.log('Database connection error: ' + err))
mongoose.connection.on('disconnected', () => console.log('Disconnected from database'))

process.on('SIGINT', () => mongoose.connection.close( () => {
  console.log('Finished App and disconnected from database')
  process.exit(0)
}))

exports.accessTokens       = require('./accesstokens');
exports.authorizationCodes = require('./authorizationcodes');
exports.clients            = require('./clients');
exports.refreshTokens      = require('./refreshtokens');
exports.users              = require('./users');
