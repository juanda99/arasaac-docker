const languages = require('../utils/languages')
const setPictogramModel = require('../models/Pictogram')
const { hair, skin } = require('../utils/constants')

const Pictograms = languages.reduce((dict, language) => {
  dict[language] = setPictogramModel(language)
  return dict
}, {})

const createCatalogByLanguage = async (req, res) => {
  const { locale } = req.params
  try {
    const catalogData = await getCatalogData(locale)
    const filesCatalog = await getFilesCatalog(locale) 
    // generate file and get statistics to save in database and res

    return res.json(catalogData)
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      message: 'Error generating catalog. See error field for detail',
      error: err
    })
  }
}

const uniq = a => [...new Set(a)]

const getFilesCatalog = async (locale, catalogData) => {
  let input, output
  const tmpDir = 
  catalogData.forEach((pictogram)=> {
    const input = path.resolve(`${pictogram.idPictogram}_500.png`)
    const output = pictogram.keywords = `${keywords}_{pictogram.idPictogram}.png`
    // let check if we generate plurals:
    let plural
    if (locale==='es') plurals = !!pictogram.plurals
    else plurals = pictogram.types.some((type) => type === 2 || type === 4)
    // let check if we generate past and future
    const action = pictogram.types.some((type) => type === 3)
    ouput = 
    // verbs
    // plural
    getFiles
  })

}

const peopleVariations = [
  { hair: hair.darkBrown, skin: skin.white },
  { hair: hair.black, skin: skin.black },
  { hair: hair.darkBrown, skin: skin.assian },
  { hair: hair.darkBrown, skin: skin.mulatto },
  { hair: hair.darkBrown, skin: skin.aztec },
]

const filesArray = (pictogram) => [
  {input: `${id}_500.png`, output: ``}
]

const copyFiles = async (input, output, progress) => {
  try {
    await fs.ensureLink(input, output)
    console.log('success!')
  } catch (err) {
    console.error(err)
  }
}

const getCatalogData = async (locale) => {
  const pictograms = await Pictograms[locale].find({}, { 'idPictogram': 1, 'keywords': 1, '_id': 0 }).lean()
  var numFiles = 0
  const catalogData = pictograms.map((pictogram) => {
    numFiles = numFiles + 1
    const keywords = pictogram.keywords.map(keyword => keyword.keyword).join('_').replace(/_\s*$/, '')
    const plurals = pictogram.keywords.map(keyword => keyword.plural).join('_').replace(/(_)\1+/g, '_').replace(/_\s*$/, '')
    const verbs = pictogram.keywords.filter(keyword => keyword.type === 3).map(keyword => keyword.keyword).join('_').replace(/(_)\1+/g, '_').replace(/_\s*$/, '')
    const types = uniq(pictogram.keywords.map((keyword) => keyword.type))
    if (plurals) numFiles += 1
    if (verbs) numFiles += 2
    return { idPictogram: pictogram.idPictogram, keywords, types, plurals, verbs }
  })
  console.log(`numFiles=${numFiles}`)
  if (locale==='es') return catalogData
  const esPictograms = await Pictograms['es'].find({}, { 'idPictogram': 1, 'keywords': 1, '_id': 0 }).lean()
  const esCatalogData = esPictograms.map((pictogram) => {
    const types = uniq(pictogram.keywords.map((keyword) => keyword.type))
    return { idPictogram: pictogram.idPictogram, types: types }
  })

  const completeCatalogData = catalogData.map ((pictogram) => {
    if (pictogram.keywords === '') {
      esCatalogData.forEach((esPictogram) => {
        if (esPictogram.idPictogram == pictogram.idPictogram) {
          pictogram.types=esPictogram.types
          return
        }
      })
    }
    return pictogram
  })

  return completeCatalogData
}

const createAllCatalogs = async (req, res) => {
  const { locale } = req.params
  try {
    const locution = `/app/locutions/${locale}/${id}.mp3`
    console.log(locution)
    console.log('ha entrado')
    let locutionName = sanitize(text)
    locutionName = locutionName ? `${locutionName}.mp3` : `{$id}.mp3`
    res.download(locution, locutionName)
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      message: 'Error getting locution. See error field for detail',
      error: err
    })
  }
}




module.exports = {
  createCatalogByLanguage,
  createAllCatalogs
}
