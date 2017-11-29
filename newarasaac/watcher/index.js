
// load dependencies
var chokidar = require('chokidar')
var fs = require('fs-extra')
var path = require('path')
const uuidv4 = require('uuid/v4')
var recursive = require('recursive-readdir')
var tar = require('tar')
const _ = require ('lodash')
var sharp = require('sharp')
const { createLogger, format, transports } = require('winston')
const { combine, timestamp, label, printf, colorize } = format

// load environment
require('dotenv').config()

// global variables and constants
var materialFiles = {}
var localePattern = /^[A-z]{2,3}$/g
const INCLUDE_FILE = "include"
const EXCLUDE_FILE = "exclude"
const INCLUDE_DIR = "includedir"
const SCREENSHOTS_DIR = process.env.SCREENSHOTS_DIR || 'screenshots'
const MATERIALS = process.env.MATERIALS || '/materials'
const RESOLUTION = process.env.RESOLUTION || 300
const NODE_ENV = process.env.NODE_ENV || 'development'
const TIME = process.env.TIME || 3000


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
var watcher = chokidar.watch(MATERIALS, {
  ignored: [/(^|[\/\\])\../, '**/screenshots_*/*', /index-[A-z]{2,3}-(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}.tgz/],
  // ignoreInitial: true,
  cwd: MATERIALS
})

logger.info('ARASAAC WATCHER STARTED')
logger.info(`It will wait ${parseInt(TIME)/1000} seconds on every material before starting processing it`)
logger.info(`Using folder: ${MATERIALS}`)
logger.info(`Start scanning....`)

process.on('uncaughtException', function (err) {
  logger.log(err)
  logger.log('error', 'Fatal uncaught exception crashed cluster', err, function (err, level, msg, meta) {
    process.exit(1)
  })
})

// Add event listeners.
watcher
  .on('add', (file) => {
    logger.info(`WATCHER - ADDED FILE: ${path.resolve(MATERIALS, file)}`)
    addTask(file, INCLUDE_FILE)
  })
  
  .on('addDir', (dir) => {
    // only task is to push dir into targetLanguages field if it's a language dir
    logger.info(`ADDED DIRECTORY: ${path.resolve(MATERIALS, dir)}`)
    addTask(dir, INCLUDE_DIR)
  })
  .on('change', (file) => {
    // generate new zip or resize screenshot (same as add task)
    logger.info(`WATCHER - CHANGED FILE: ${path.resolve(MATERIALS, file)}`)
    addTask(file, INCLUDE_FILE)
  })
  .on('unlink', (file) => {
    // generate new zip or remove screenshot
    logger.info(`WATCHER - REMOVED FILE: ${path.resolve(MATERIALS, file)}`)
    addTask(file, EXCLUDE_FILE)
  })
  .on('error', error => logger.error(`WATCHER ERROR: ${error}`))
  .on('ready', () => logger.info('Initial scan complete, waiting for changes'))

const initMaterial = (materialId) => {
  let languages = dirs(path.resolve(MATERIALS, materialId))
  materialFiles[materialId] = {
    materialId,
    includeScreenshots: [],
    excludeScreenshots: [],
    languages: new Set(languages),
    targetLanguages: new Set()
  }
}

// function to get all languages from a directory
const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory() && f.match(/^[A-z]{2,3}$/))
// list files, not directories, not tgz.
const listFiles = p => fs.readdirSync(p).filter(f => {
  let filePattern = new RegExp(`^index-[A-z]{2,3}-[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}.tgz$`, 'i')
  return !fs.statSync(path.join(p, f)).isDirectory() && !filePattern.test(f)
})

const addTask = (file, operation) =>{
  let materialId = path.dirname(file).split(path.sep)[0]
  let dir = path.dirname(path.resolve(MATERIALS, file))
  let relativeDir = path.basename(file)
  // if not initialized, we do it before pushing data
  if (!materialFiles[materialId]) initMaterial(materialId)
  let material = materialFiles[materialId]
  // depending on material type we add where it should be
  // *screenshots*
  if (dir.match(/screenshots$/)|| dir.match(/screenshots\/[A-z]{2,3}$/)) material[`${operation}Screenshots`].push(file)
  // *directories*
  else if ((operation==INCLUDE_DIR) && relativeDir.match(/^[A-z]{2,3}$/)) {
    material.languages.add(relativeDir)
    logger.info(`ADD LANGUAGE: ${relativeDir} for material ${materialId}`)
  }
  else if ((operation==INCLUDE_DIR) && !path.basename(file).match(/^[A-z]{2,3}$/)) {
    logger.warn(`Directory ${file} added, but not executing any action!`)
    return
  // *material files*
  } else {
    let dirName = dir.split(path.sep).pop()
    let parentDir = path.resolve(dir, '..')
    let parentDirName = parentDir.split(path.sep).pop()
    if (dirName == materialId) material.targetLanguages = material.languages    
    else if (parentDirName == materialId) material.targetLanguages.add(dirName) //dirName should be the language
    else {
      logger.warn(`File ${file} added, but not executing any action!`)
      return
    }
  }
  // call our actions via sync - debounce (lodash)
  operateDebounced(material)
}

// https://stackoverflow.com/questions/28787436/debounce-a-function-with-argument
var operateDebounced = _.wrap(
  _.memoize(() => _.debounce(sync, wait=TIME), _.property('materialId')), 
  (func, obj) => func(obj)(obj)
)

sync = async (material) => {
  // remove files from screenshosts_300
  material.excludeScreenshots.map((file) => {
    file.replace('screenshots', `screenshots_${RESOLUTION}`)
    // delete the file from screenshots)
    fs.remove(path.resolve(MATERIALS, file), err => {
      if (err) logger.error(err)
      else logger.info(`REMOVE SCREENSHOT: ${file}`)
    })
  })
  // add screenshots to screenshots_300
  material.includeScreenshots.map((file) => resizeImage (file, material.materialId, RESOLUTION))

  // zip files 
  try {
    zipFiles(material)
    // if (material.targetLanguages.size) zipFiles(material)
  } catch(err) {
    logger.error(err)
  }

  // reset materialId
  material.includeScreenshots= []
  material.excludeScreenshots= []
  material.targetLanguages= new Set()
}

const zipFiles = async (material) => {
  // get all the ZipFiles per language
  let id = material.materialId
  try {
    let zipFiles = getZipFiles(id)
    // case no language defined, we take a default one, called 'xx'
    if (material.targetLanguages.size===0) material.targetLanguages.add('xx')
    material.targetLanguages.forEach( async (language) => {
      let languageZipFiles = getZipFile(language, zipFiles)
      languageZipFiles.forEach(async (file)=> await fs.remove(path.resolve(MATERIALS, id, file)))
      let newZip = path.resolve(MATERIALS, id, `index-${language}-${uuidv4()}.tgz`)
      let files = listFiles(path.resolve(MATERIALS, id))
      let copyFiles = (language=='xx') ? [...files] : [...files, language]
      // if language doesn't exist (xx case) it throws an error
      tar.c({gzip: true, sync: true, onwarn: prueba, file: newZip, cwd: path.resolve(MATERIALS, id)}, copyFiles)
      logger.info(`ZIP GENERATED: ${newZip}`)
    })
  } catch (error) {
    logger.error(error);
  }
}
const prueba = (message, data) => {console.log(message)};

const resizeImage = (file, materialId, size) => {
  let extension = path.extname(file)
  if (extension==='.png'||extension==='.jpg'||extension==='.jpeg'|| extension==='.gif') {
    let newDir = path.resolve(MATERIALS, path.dirname(file), '..', `${SCREENSHOTS_DIR}_${size}`)
    fs.ensureDir(newDir)
    .then(() => {
      let fileName = path.basename(file)
      sharp(`${MATERIALS}/${file}`)
      .resize(null, parseInt(size))
      .toFile(`${newDir}/${fileName}`, function(err) {
        if (err) logger.error(`Error generating screenshotfile:${err}`)
        else logger.info(`GENERATE SCREENSHOT: ${newDir}/${fileName}`)
      })
    })
    .catch(err => {
      logger.error(`Error creating dir for screenshots:${err}`)
    })
  }
}

const getZipFiles = (materialId) => {
    let filePattern = new RegExp(`^index-[A-z]{2,3}-[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}.tgz$`, 'i')
    let files =  fs.readdirSync(path.resolve(MATERIALS, materialId))
    return files.filter((file) => filePattern.test(file))
}

const getZipFile = (language, zipFiles) => {
  try {
    let filePattern = new RegExp(`^index-${language}-[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}.tgz$`, 'i')
    return zipFiles.filter((file) => filePattern.test(file))
  } catch (error) {
    logger.error(error)
  }
}
