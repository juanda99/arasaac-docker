
// load dependencies
var chokidar = require('chokidar')
var path = require('path')
var sharp = require('sharp')
var imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
const fs = require('fs')
const pLimit = require('p-limit')
const limit = pLimit(1)


const { createLogger, format, transports } = require('winston')
const { combine, timestamp, label, printf, colorize } = format

// load environment
require('dotenv').config()

// global variables and constants
const INCLUDE_FILE = "include"
const EXCLUDE_FILE = "exclude"
const SVG_DIR= process.env.SVG_DIR || '/app/svg'
const IMAGE_DIR = process.env.IMAGE_DIR || '/app/pictos'
const RESOLUTIONS = [300, 500, 2500]
const NODE_ENV = process.env.NODE_ENV || 'development'





// log configuration
const myFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`
})


const logger = createLogger({
  format: combine(
    colorize(),
    timestamp(),
    myFormat
  ), 
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log` 
    // - Write all logs error (and below) to `error.log`.
    //
    new transports.File({
      filename: 'error.log',
      level: 'error'
    })/*,
    new transports.File({
      filename: 'combined.log'
    })*/
  ]
})


//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    level: 'debug'
  }))
}


// Initialize watcher.
var watcher = chokidar.watch(`${SVG_DIR}/*.svg`, {
  ignoreInitial: true,
  cwd: SVG_DIR,
  awaitWriteFinish: {
    stabilityThreshold: 3000,
    pollInterval: 300
  }
})

logger.info('ARASAAC SVG-WATCHER STARTED')
logger.info(`Using folder: ${SVG_DIR}`)
logger.info(`Start scanning....`)

process.on('uncaughtException', function (err) {
  // logger.log(err)
  console.log(err)
  logger.error('error', 'Fatal uncaught exception crashed cluster', err, function (err, level, msg, meta) {
    process.exit(1)
  })
})



// Add event listeners.
watcher
  .on('add', (file) => {
    logger.info(`WATCHER - ADD FILE: ${path.resolve(SVG_DIR, file)}`)
    limit(()=>{addTask(file, INCLUDE_FILE)})
  })

  .on('unlink', (file) => {
    // generate new zip or remove screenshot
    logger.info(`WATCHER - REMOVED FILE: ${path.resolve(SVG_DIR, file)}`)
    addTask(file, EXCLUDE_FILE)
  })
  .on('error', error => logger.error(`WATCHER ERROR: ${error}`))
  .on('ready', () => logger.info('Initial scan complete, waiting for changes'))



const addTask = (file, operation) => {
  if (operation===INCLUDE_FILE) {
    logger.info(`ADD FILE : ${file}`)
    // resize just when size is bigger than 1500
    RESOLUTIONS.forEach(resolution => getPNG(file, resolution))
  }
}

const getPNGFileName = (file, resolution) => path.resolve(IMAGE_DIR, `${path.basename(file, '.svg')}_${resolution}.png` )

const convertSVG = (file, resolution) => {
  // density 450p is for 3125x image
  const density = parseInt(0.144 * resolution)
  return sharp(path.resolve(SVG_DIR, file), { density }).png().toBuffer()
}
const getPNG= (file, resolution, resize) => {
  let fileName = getPNGFileName(file, resolution)
  convertSVG(file, resolution, file)
  .then (buffer => {
    return imagemin.buffer(buffer, {
      plugins: [
        imageminPngquant({quality: '65-80', speed: 10})
      ]
    })
  })
  .then(buffer => {
    fs.open(fileName, 'w', function(err, fd) {  
      if (err) {
          throw 'could not open file: ' + err
      }
      // write the contents of the buffer, from position 0 to the end, to the file descriptor returned in opening our file
      fs.write(fd, buffer, 0, buffer.length, null, function(err) {
          if (err) throw 'error writing file: ' + err
          fs.close(fd, function() {
            logger.info(`IMAGE GENERATED: ${fileName}`)
          })
      })
    })
  }) 
  .catch(err => { 
    logger.error(`Error converting ${file}:`)
    logger.error(err) 
  })
}



