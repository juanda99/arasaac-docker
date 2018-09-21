var imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
var path = require('path')
const fs = require('fs')
var sharp = require('sharp')
const logger = require('./logger')

const IMAGE_DIR = process.env.IMAGE_DIR || '/app/pictos'
const SVG_DIR= process.env.SVG_DIR || '/app/svg'

const getPNGFileName = (file, resolution) => path.resolve(IMAGE_DIR, `${path.basename(file, '.svg')}_${resolution}.png` )

const minifyPNG= async (file, resolution) => {
  let fileName = getPNGFileName(file, resolution)
  // density 450p is for 3125x image
  const density = parseInt(0.144 * resolution)

  try {
    const buffer = await sharp(path.resolve(SVG_DIR, file), { density }).png().toBuffer()
    const newBuffer = await imagemin.buffer(buffer, {
      plugins: [
        imageminPngquant({quality: '65-80', speed: 10})
      ]
    })
    const fd = fs.openSync(fileName, 'w')
    // write the contents of the buffer, from position 0 to the end, to the file descriptor returned in opening our file
    fs.writeSync(fd, buffer, 0, buffer.length, null)
    fs.closeSync(fd)
    await logger.info(`IMAGE GENERATED: ${fileName}`)
  }
  catch(err) { 
    logger.error(`Error converting ${file}:`)
    logger.error(err.message) 
  }
}

module.exports = minifyPNG
