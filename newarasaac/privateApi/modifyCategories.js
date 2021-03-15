const setPictogramModel = require('./models/Pictogram')
const Category = require('./models/Category')
const languages = require('./utils/languages')
const jp = require('jsonpath')

/* bbdd config */
// require('./db')
const mongoose = require('mongoose')
const databaseUrl = `mongodb://root:example@localhost:27000/arasaac?authSource=admin`

mongoose.Promise = global.Promise
mongoose
  .connect(databaseUrl, {
    useNewUrlParser: true,
  })
  .then(
    () => {
      console.log(`Connected to database: ${databaseUrl}`)
      importFile()
    },
    (err) => {
      console.log(`Database connection error: ${err}`)
    }
  )

const baseCategories = [
  'movement',
  'feeding',
  'communication',
  'education',
  'work',
  'leisure',
  'knowledge',
  'religion',
  'living being',
  'time',
  'object',
  'document',
  'place',
  'miscellaneous',
]

const baseTags = [
  'movement',
  'feeding',
  'communication',
  'education',
  'work',
  'leisure',
  'knowledge', // add tag!
  'religion',
  'living being', // add  tag!
  'time', // add tag!
  'object',
  'document',
  'place',
  'miscellaneous', // add tag?
]

// mongoose.Promise = global.Promise
// mongoose
//   .connect(databaseUrl, {
//     useNewUrlParser: true,
//   })
//   .then(
//     () => {
//       console.log(`Connected to database: ${databaseUrl}`)
//       importFile()
//     },
//     (err) => {
//       logger.error(`Database connection error: ${err}`)
//     }
//   )

const Pictograms = languages.reduce((dict, language) => {
  dict[language] = setPictogramModel(language)
  return dict
}, {})

const getIds = async () => {
  const data = await Pictograms['en'].find({ aac: true }, { _id: 1 }).lean()
  const ids = data.map((item) => item._id)
  return ids
}

const processData = async () => {
  const ids = await getIds()
  const categoryTree = await Category.findOne({ locale: 'en' }, { _id: 0 })
  for (const language of languages) {
    console.log(`Processing language ${language}....`)
    for (const id of ids) {
      let found = false
      try {
        const Pictogram = await Pictograms[language].findById(id)
        const categories = Pictogram.categories
        for (const category of categories) {
          const partialData = jp
            .paths(categoryTree.data, `$..["${category}"]`)
            .flat()
          if (partialData.length > 1) {
            const newCategory = `core vocabulary-${partialData[1]}`
            if (categories.indexOf(newCategory) === -1) {
              categories.push(newCategory)
              found = true
            }
          }
        }

        if (found && Pictogram.tags.indexOf('core vocabulary') === -1) {
          Pictogram.tags.push('core vocabulary')
          await Pictogram.save()
        }
      } catch (e) {
        console.log(
          `Error processing pictogram with id ${id} and language ${language}. Error: ${e}`
        )
      }
    }
  }
  console.log('Done!!!!!')
}

processData()

// const { iwKeywords } = require('./pictostr.js')

const importFile = async () => {
  // get all pictogram data from en
  // await Promise.all(
  //   iwKeywords.map(async (picto) => {
  //     const _id = picto.idPictogram
  //     const keywords = picto.keywords
  //     console.log(`Saving pictogram ${_id}`)
  //     await Pictograms['he'].findOneAndUpdate(
  //       { _id },
  //       { keywords, lastUpdated: now }
  //     )
  //   })
  // )
}
