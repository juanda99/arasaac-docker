const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
const path = require('path')
const fs = require('fs-extra')
const logger = require('./logger')
const {
  getPNGFileName,
  getOptions,
  convertSVG,
  modifySVG,
  hasHair,
  hasSkin
} = require('./utils/svg')

const SVG_DIR = '/app/svg'
// env variable come as a string! Be careful!!
const overwrite = process.env.OVERWRITE === '1'

// generate all
const createPNGFiles = async (file, resolution) => {
  /* get options from preCompiledOptions */

  const optionsArray = getOptions(resolution)

  try {
    const svgContent = await fs.readFile(path.resolve(SVG_DIR, file), 'utf-8')
    const withHair = hasHair(svgContent)
    const withSkin = hasSkin(svgContent)
    optionsArray.forEach(async options => {
      if (options.hair && !withHair) return
      if (options.skin && !withSkin) return
      const fileName = await getPNGFileName(file, options)
      if (!overwrite && fs.existsSync(fileName)) {
        logger.info(`FILE ALREADY GENERATED: ${fileName}`)
      } else {
        /* if we need to generate with a different hair or skin and code is not inside the svg, we don't use it */
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
                fs.close(fd, () => logger.info(`IMAGE GENERATED: ${fileName}`))
              })
            })
          })
          .catch(err => {
            logger.error(`ERROR GENERATING: ${fileName}: ${err.message}`)
          })
      }
    })
  } catch (err) {
    logger.error(err.message)
  }
}

module.exports = createPNGFiles
