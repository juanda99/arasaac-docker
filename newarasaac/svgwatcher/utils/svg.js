const fs = require('fs-extra')
const path = require('path')
const sharp = require('sharp')
var flatten = require('arr-flatten')
const { pluralSVGCode, pastSVGCode, futureSVGCode } = require('./svgCodes')

const IMAGE_DIR = '/app/pictograms'

const skin = {
  white: '#F5E5DE',
  black: '#A65C17',
  assian: '#F4ECAD',
  mulatto: '#E3AB72',
  aztec: '#CF9D7C'
}

const schematic = '#FEFEFE'

const hair = {
  brown: '#A65E26',
  blonde: '#FDD700',
  red: '#ED4120',
  black: '#020100',
  gray: '#EFEFEF',
  darkGray: '#AAABAB',
  darkBrown: '#6A2703'
}

/* variations we need depending on resolution */
const preCompiledOptions = {
  300: { plural: true, action: true },
  500: { plural: true, action: true, color: true, peopleAppearance: true },
  2500: { color: true, peopleAppearance: true }
}

const getNextLayer = layer => {
  const layers = ['Fondo', 'contorno2', 'relleno', 'contorno']
  const layerIndex = layers.indexOf(layer) + 1
  if (layerIndex < 4) {
    return `<g id="${layers[layerIndex]}">`
  }
  return '</svg>'
}

const modifyLayer = (fileContent, layer, layerText) => {
  const startAt = `<g id="${layer}">`
  const finishAt = getNextLayer(layer)
  let s = fileContent.indexOf(startAt)
  let f = fileContent.indexOf(finishAt)
  return `${fileContent.substr(
    0,
    s
  )}<g id="${layer}">${layerText}</g>\n${fileContent.substr(f)}`
}

const addLayer = (fileContent, layer, layerText) => {
  let s = fileContent.indexOf('</svg>')
  return `${fileContent.substr(0, s)}<g id="${layer}">${layerText}</g>\n</svg>`
}

const getPNGFileName = async (file, options) => {
  const { plural, color, action, resolution, hair, skin } = options
  const idFile = path.basename(file, '.svg')
  let fileName = idFile
  if (plural) fileName = `${fileName}_plural`
  if (!color) fileName = `${fileName}_nocolor`
  if (action !== 'present') fileName = `${fileName}_action-${action}`
  if (hair) fileName = `${fileName}_hair-${hair.substr(1, 6)}`
  if (skin) fileName = `${fileName}_skin-${skin.substr(1, 6)}`
  fileName = `${fileName}_${resolution}`
  await fs.ensureDir(path.resolve(IMAGE_DIR, idFile))
  return path.resolve(IMAGE_DIR, idFile, `${fileName}.png`)
}

const getPeopleAppearanceOptions = (defaultValues, initOptions) => {
  const options = []
  // add skins:
  options.push(
    Object.keys(skin).map(skinType => ({
      skin: skin[skinType],
      ...defaultValues
    }))
  )

  options.push(
    Object.keys(hair).map(hairType => ({
      hair: hair[hairType],
      ...defaultValues
    }))
  )
  options.push(
    flatten(
      Object.keys(skin).map(skinType =>
        Object.keys(hair).map(hairType => ({
          hair: hair[hairType],
          skin: skin[skinType],
          ...defaultValues
        }))
      )
    )
  )

  if (initOptions.plural) {
    // add skins:
    options.push(
      Object.keys(skin).map(skinType => ({
        skin: skin[skinType],
        ...defaultValues,
        plural: true
      }))
    )

    options.push(
      Object.keys(hair).map(hairType => ({
        hair: hair[hairType],
        ...defaultValues,
        plural: true
      }))
    )
    options.push(
      flatten(
        Object.keys(skin).map(skinType =>
          Object.keys(hair).map(hairType => ({
            hair: hair[hairType],
            skin: skin[skinType],
            ...defaultValues,
            plural: true
          }))
        )
      )
    )
  }

  if (initOptions.action) {
    ;['past', 'future'].forEach(action => {
      // add skins:
      options.push(
        Object.keys(skin).map(skinType => ({
          skin: skin[skinType],
          ...defaultValues,
          action
        }))
      )

      options.push(
        Object.keys(hair).map(hairType => ({
          hair: hair[hairType],
          ...defaultValues,
          action
        }))
      )
      options.push(
        flatten(
          Object.keys(skin).map(skinType =>
            Object.keys(hair).map(hairType => ({
              hair: hair[hairType],
              skin: skin[skinType],
              ...defaultValues,
              action
            }))
          )
        )
      )
    })
  }
  return flatten(options)
}

const getOptions = resolution => {
  const initOptions = preCompiledOptions[resolution]
  const colors = [true]
  if (initOptions.color) colors.push(false)
  const options = []
  const defaultValues = {
    resolution,
    color: true,
    action: 'present'
  }
  colors.forEach(color => {
    options.push({ ...defaultValues, color })
    if (initOptions.plural) {
      options.push({ ...defaultValues, plural: true, color })
    }
    if (initOptions.action) {
      options.push(
        { ...defaultValues, action: 'past', color },
        { ...defaultValues, action: 'future', color }
      )
    }
  })
  if (initOptions.peopleAppearance) {
    options.push(getPeopleAppearanceOptions(defaultValues, initOptions))
  }
  return flatten(options)
}

const skinsToRemove = `${skin.white}|${schematic}`
// important ! regex without -g option because it's acumulative between interations
const reSkin = new RegExp(skinsToRemove, 'im')
const modifySkin = (fileContent, key) =>
  fileContent.replace(reSkin, skin[key] || key)
const hasSkin = fileContent => reSkin.test(fileContent)

const hairToRemove = () => {
  let value = ''
  Object.keys(hair).forEach(function (key) {
    value += `${hair[key]}|`
  })
  return value.slice(0, -1)
}
const reHair = new RegExp(hairToRemove(), 'im')
const modifyHair = (fileContent, key) =>
  fileContent.replace(reHair, hair[key] || key)
const hasHair = fileContent => reSkin.test(fileContent)

const modifySVG = (fileContent, options) => {
  let content = fileContent
  const { plural, color, backgroundColor, action, hair, skin } = options
  if (plural) content = addLayer(content, 'plural', pluralSVGCode)
  if (backgroundColor) {
    content = modifyLayer(
      content,
      'Fondo',
      `<rect x="-55" y="147" style="fill:${backgroundColor};" width="500" height="500"/>`
    )
  }
  if (!color) content = modifyLayer(content, 'relleno', '')
  if (action === 'future') content = addLayer(content, 'action', futureSVGCode)
  else if (action === 'past') content = addLayer(content, 'action', pastSVGCode)
  if (hair) content = modifyHair(content, hair)
  if (skin) content = modifySkin(content, skin)

  /* eslint-enable no-param-reassign */
  return content
}

const convertSVG = (fileContent, resolution) => {
  // density 450p is for 3125x image
  const density = parseInt(0.144 * resolution, 10)
  const fileBuffer = Buffer.from(fileContent)
  return sharp(fileBuffer, { density })
    .png()
    .toBuffer()
}

module.exports = {
  getOptions,
  getPNGFileName,
  convertSVG,
  modifySVG,
  hasSkin,
  hasHair,
  preCompiledOptions
}
