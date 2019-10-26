const mongoose = require('mongoose')
const databaseUrl = 'mongodb://mongodb/arasaac'
const logger = require('./utils/logger')

mongoose.Promise = global.Promise
mongoose.connect(databaseUrl, { useNewUrlParser: true }).then(
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
