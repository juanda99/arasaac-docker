const mongoose = require('mongoose')
const config = require('./config')

const { databaseUrl } = config

mongoose.Promise = global.Promise

mongoose.connect(databaseUrl).then(
  () => {
    console.log(`Connected to database: ${databaseUrl}`)
  },
  err => {
    console.log(`Database connection error: ${err}`)
  }
)

mongoose.set('useFindAndModify', false)

process.on('SIGINT', () =>
  mongoose.connection.close(() => {
    console.log('Finished App and disconnected from database')
    process.exit(0)
  })
)
