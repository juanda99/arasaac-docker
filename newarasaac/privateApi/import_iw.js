const setPictogramModel = require('./models/Pictogram')
const languages = require('./utils/languages')

const mongoose = require('mongoose')
const MONGO_DB_USER = process.env.MONGO_DB_USER
const MONGO_DB_PWD = process.env.MONGO_DB_PWD
const databaseUrl = `mongodb://${MONGO_DB_USER}:${MONGO_DB_PWD}@mongodb/arasaac?authSource=admin`
const logger = require('./utils/logger')

mongoose.Promise = global.Promise
mongoose
  .connect(databaseUrl, {
    useNewUrlParser: true
  })
  .then(
    () => {
      console.log(`Connected to database: ${databaseUrl}`)
      importFile()
    },
    err => {
      logger.error(`Database connection error: ${err}`)
    }
  )

const Pictograms = languages.reduce((dict, language) => {
  dict[language] = setPictogramModel(language)
  return dict
}, {})

const { iwKeywords } = require('./pictostr.js')
const now = Date.now()

const importFile = async () => {
  await Promise.all(
    iwKeywords.map(async picto => {
      const _id = picto.idPictogram
      const keywords = picto.keywords
      console.log(`Saving pictogram ${_id}`)
      await Pictograms['iw'].findOneAndUpdate(
        { _id },
        { keywords, lastUpdated: now }
      )
    })
  )
}
