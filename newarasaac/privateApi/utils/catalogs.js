const filenamify = require('filenamify')
const fs = require('fs-extra')
const path = require('path')
const logger = require('./logger')
const { hair, skin, IMAGE_DIR, tmpCatalogDir } = require('./constants')
const languages = require('./languages')
const setPictogramModel = require('../models/Pictogram')

const Pictograms = languages.reduce((dict, language) => {
  dict[language] = setPictogramModel(language)
  return dict
}, {})

const getCatalogData = async locale => {
  const pictograms = await Pictograms[locale]
    .find({}, { idPictogram: 1, keywords: 1, _id: 0 })
    .lean()
  var numFiles = 0
  const catalogData = pictograms.map(pictogram => {
    numFiles = numFiles + 1
    const keywords = pictogram.keywords
      .map(keyword => keyword.keyword)
      .join('_')
      .replace(/(_)\1+/g, '_')
      .replace(/_\s*$/, '')
      .replace(/^_/, '')
    const plurals = pictogram.keywords
      .map(keyword => keyword.plural)
      .join('_')
      .replace(/(_)\1+/g, '_')
      .replace(/_\s*$/, '')
      .replace(/^_/, '')
    const verbs = pictogram.keywords
      .filter(keyword => keyword.type === 3)
      .map(keyword => keyword.keyword)
      .join('_')
      .replace(/(_)\1+/g, '_')
      .replace(/_\s*$/, '')
      .replace(/^_/, '')
    const types = uniq(pictogram.keywords.map(keyword => keyword.type))
    return {
      idPictogram: pictogram.idPictogram,
      keywords: filenamify(keywords, { replacement: '' }),
      types,
      plurals: filenamify(plurals, { replacement: '' }),
      verbs: filenamify(verbs, { replacement: '' })
    }
  })
  if (locale === 'es') return catalogData
  const esPictograms = await Pictograms['es']
    .find({}, { idPictogram: 1, keywords: 1, _id: 0 })
    .lean()
  const esCatalogData = esPictograms.map(pictogram => {
    const types = uniq(pictogram.keywords.map(keyword => keyword.type))
    return { idPictogram: pictogram.idPictogram, types: types }
  })
  // pictos without keywords, doesn't have types (for plural and verbs)
  // we fill catalog typs from esCatalog
  const completeCatalogData = catalogData.map(pictogram => {
    if (pictogram.keywords === '') {
      esCatalogData.forEach(esPictogram => {
        if (esPictogram.idPictogram === pictogram.idPictogram) {
          pictogram.types = esPictogram.types
        }
      })
    }
    return pictogram
  })

  return completeCatalogData
}

const getFilesCatalog = async (locale, catalogData) =>
  Promise.all(
    catalogData.map(async pictogram => {
      const plurals =
        locale === 'es'
          ? !!pictogram.plurals
          : pictogram.types.some(type => type === 2 || type === 4)
      const action = pictogram.types.some(type => type === 3)
      return Promise.all([
        getDefaultFile(pictogram, locale),
        getPluralFile(pictogram, plurals, locale),
        getActionFiles(pictogram, action, locale),
        getPeopleFiles(pictogram, plurals, action, locale)
      ])
    })
  )

const getDefaultFile = async (pictogram, locale) => {
  const TMP_DIR = tmpCatalogDir(locale)
  const inputFile = await path.resolve(
    IMAGE_DIR,
    pictogram.idPictogram.toString(),
    `${pictogram.idPictogram}_500.png`
  )
  const outputFile = path.resolve(
    TMP_DIR,
    `${pictogram.keywords}_${pictogram.idPictogram}.png`
  )
  return copyFiles(inputFile, outputFile)
}

const getPluralFile = async (pictogram, plurals, locale) => {
  const TMP_DIR = tmpCatalogDir(locale)
  if (plurals) {
    const inputFile = path.resolve(
      IMAGE_DIR,
      pictogram.idPictogram.toString(),
      `${pictogram.idPictogram}_plural_500.png`
    )
    const outputFile = path.resolve(
      TMP_DIR,
      `${pictogram.plurals || pictogram.keywords}_plural_${
        pictogram.idPictogram
      }.png`
    )

    return copyFiles(inputFile, outputFile)
  }
}

const getActionFiles = async (pictogram, action, locale) => {
  const TMP_DIR = tmpCatalogDir(locale)
  if (action) {
    return Promise.all(
      ['past', 'future'].map(async action => {
        const inputFile = path.resolve(
          IMAGE_DIR,
          pictogram.idPictogram.toString(),
          `${pictogram.idPictogram}_action-${action}_500.png`
        )
        const outputFile = path.resolve(
          TMP_DIR,
          `${pictogram.verbs}_${action}_${pictogram.idPictogram}.png`
        )
        return copyFiles(inputFile, outputFile)
      })
    )
  }
}

const getPeopleFiles = async (pictogram, plurals, action, locale) =>
  Promise.all([
    getCommonPeopleFiles(pictogram, locale),
    getPluralPeopleFiles(pictogram, plurals, locale),
    getActionPeopleFiles(pictogram, action, locale)
  ])

const getCommonPeopleFiles = async (pictogram, locale) => {
  const TMP_DIR = tmpCatalogDir(locale)
  return Promise.all(
    peopleVariations.map(async person => {
      const inputFile = path.resolve(
        IMAGE_DIR,
        pictogram.idPictogram.toString(),
        `${pictogram.idPictogram}_hair-${person.hair}_skin-${
          person.skin
        }_500.png`
      )
      const existInputFile = await fs.exists(inputFile)
      if (existInputFile) {
        const outputFile = path.resolve(
          TMP_DIR,
          `${pictogram.keywords}_hair-${person.hair}_skin-${person.skin}_${
            pictogram.idPictogram
          }.png`
        )
        return copyFiles(inputFile, outputFile)
      }
    })
  )
}

const getPluralPeopleFiles = async (pictogram, plurals, locale) => {
  const TMP_DIR = tmpCatalogDir(locale)
  if (plurals) {
    return Promise.all(
      peopleVariations.map(async person => {
        const inputFile = path.resolve(
          IMAGE_DIR,
          pictogram.idPictogram.toString(),
          `${pictogram.idPictogram}_plural_hair-${person.hair}_skin-${
            person.skin
          }_500.png`
        )
        const existInputFile = await fs.exists(inputFile)
        if (existInputFile) {
          const outputFile = path.resolve(
            TMP_DIR,
            `${pictogram.plurals || pictogram.keywords}_plural_hair-${
              person.hair
            }_skin-${person.skin}_${pictogram.idPictogram}.png`
          )
          return copyFiles(inputFile, outputFile)
        }
      })
    )
  }
}

const getActionPeopleFiles = async (pictogram, action, locale) => {
  const TMP_DIR = tmpCatalogDir(locale)
  if (action) {
    return Promise.all(
      peopleVariations.map(async person =>
        Promise.all(
          ['past', 'future'].map(async action => {
            const inputFile = path.resolve(
              IMAGE_DIR,
              pictogram.idPictogram.toString(),
              `${pictogram.idPictogram}_action-${action}_hair-${
                person.hair
              }_skin-${person.skin}_500.png`
            )
            const existInputFile = await fs.exists(inputFile)
            if (existInputFile) {
              const outputFile = path.resolve(
                TMP_DIR,
                `${pictogram.verbs}_${action}_hair-${person.hair}_skin-${
                  person.skin
                }_${pictogram.idPictogram}.png`
              )
              return copyFiles(inputFile, outputFile)
            }
          })
        )
      )
    )
  }
}

const peopleVariations = [
  { hair: hair.darkBrown.substring(1), skin: skin.white.substring(1) },
  { hair: hair.black.substring(1), skin: skin.black.substring(1) },
  { hair: hair.darkBrown.substring(1), skin: skin.assian.substring(1) },
  { hair: hair.darkBrown.substring(1), skin: skin.mulatto.substring(1) },
  { hair: hair.darkBrown.substring(1), skin: skin.aztec.substring(1) }
]

const copyFiles = async (input, output) => {
  try {
    await fs.ensureLink(input, output)
  } catch (err) {
    logger.error(`CREATING CATALOG: ${err.message}`)
  }
}

const uniq = a => [...new Set(a)]

module.exports = {
  getCatalogData,
  getFilesCatalog
}
