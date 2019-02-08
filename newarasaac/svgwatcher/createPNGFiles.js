const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
const path = require('path')
const fs = require('fs-extra')
const logger = require('./logger')
const {
  getPNGFileName,
  getOptions,
  convertSVG,
  modifySVG
} = require('./utils/svg')
const SVG_DIR = process.env.SVG_DIR || '/app/svg'

const minifyPNG = async (file, resolution) => {
  /* get options from preCompiledOptions */

  const optionsArray = getOptions(resolution)

  optionsArray.forEach(async options => {
    try {
      const fileName = await getPNGFileName(file, options)
      const svgContent = await fs.readFile(path.resolve(SVG_DIR, file), 'utf-8')
      let newSVGContent = modifySVG(svgContent, options)
      convertSVG(newSVGContent, options.resolution)
        .then(buffer =>
          imagemin.buffer(buffer, {
            plugins: [imageminPngquant({ quality: '65-80', speed: 10 })]
          })
        )
        .then(buffer => {
          fs.open(fileName, 'w', function (err, fd) {
            if (err) {
              throw new Error(`could not open file: ${err}`)
            }
            // write the contents of the buffer, from position 0 to the end, to the file descriptor returned in opening our file
            fs.write(fd, buffer, 0, buffer.length, null, function (err) {
              if (err) throw new Error(`error writing file: ${err}`)
              fs.close(fd, () => console.log(`IMAGE GENERATED: ${fileName}`))
            })
          })
        })
    } catch (err) {
      logger.error(err)
    }
  })
}

module.exports = minifyPNG
