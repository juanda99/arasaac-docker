const mongoose = require('mongoose')
const MONGO_DB_USER = process.env.MONGO_DB_USER
const MONGO_DB_PWD = process.env.MONGO_DB_PWD
const databaseUrl = `mongodb://${MONGO_DB_USER}:${MONGO_DB_PWD}@mongodb/arasaac?authSource=admin`
const logger = require('./utils/logger')

mongoose.Promise = global.Promise
mongoose.connect(databaseUrl, { useNewUrlParser: true, useUnifiedTopology: true }).then(
  () => {
    logger.info(`Connected to database: ${databaseUrl}`)
  },
  err => {
    logger.error(`Database connection error: ${err}`)
  }
)

mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)

process.on('SIGINT', () =>
  mongoose.connection.close(() => {
    console.log('Finished App and disconnected from database')
    process.exit(0)
  }))
