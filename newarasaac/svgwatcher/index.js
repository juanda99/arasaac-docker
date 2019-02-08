// load dependencies

var chokidar = require('chokidar')
var path = require('path')

const logger = require('./logger')
const createPNGFiles = require('./createPNGFiles')

// global

require('dotenv').config()

const INCLUDE_FILE = 'include'
const EXCLUDE_FILE = 'exclude'
const SVG_DIR = process.env.SVG_DIR || '/app/svg'
const RESOLUTIONS = [300, 500, 2500]

// Init watcher

logger.info('ARASAAC SVG-WATCHER STARTED')
logger.info(`Using folder: ${SVG_DIR}`)
logger.info(`Start scanning....`)

var watcher = chokidar.watch(`${SVG_DIR}/*.svg`, {
  ignoreInitial: true,
  // move to env variable, 0 for mac, 1 for server
  usePolling: true,
  cwd: SVG_DIR,
  awaitWriteFinish: {
    stabilityThreshold: 3000,
    pollInterval: 300
  }
})

// Add event listeners.
watcher
  .on('add', file => {
    logger.info(`WATCHER - ADD FILE: ${path.resolve(SVG_DIR, file)}`)
    addTask(file, INCLUDE_FILE)
  })

  .on('unlink', file => {
    // generate new zip or remove screenshot
    logger.info(`WATCHER - REMOVED FILE: ${path.resolve(SVG_DIR, file)}`)
    addTask(file, EXCLUDE_FILE)
  })
  .on('error', error => logger.error(`WATCHER ERROR: ${error.message}`))
  .on('ready', () => logger.info('Initial scan complete, waiting for changes'))

const addTask = (file, operation) => {
  if (operation === INCLUDE_FILE) {
    logger.info(`ADD FILE : ${file}`)
    // resize just when size is bigger than 1500
    RESOLUTIONS.forEach(resolution => createPNGFiles(file, resolution))
  }
}
