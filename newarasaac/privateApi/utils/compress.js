const archiver = require('archiver')
const fs = require('fs-extra')
const async = require('async')
const logger = require('./logger')
const { WS_CATALOG_STATUS } = require('./constants')

/* global catalogStatus, catalogStatistics */

const compressDirToZip = async (directory, zipFile, locale, io) =>
  new Promise((resolve, reject) => {
    let previousPercent = 0
    logger.debug(`CREATING CATALOG: Generating zip file`)
    catalogStatus[locale].step = 3
    catalogStatus[locale].complete = 20
    io.emit(WS_CATALOG_STATUS, catalogStatus)
    return directorySize(directory, async (err, totalSize) => {
      if (err) {
        logger.debug(err)
        reject(err)
      }
      var prettyTotalSize = bytesToSize(totalSize)

      // create a file to stream archive data to.
      const destinationStream = fs.createWriteStream(zipFile)

      const archive = archiver(
        'zip' /* {
        zlib: { level: 9 } // Sets the compression level.
      } */
      )

      archive.on('error', err => {
        logger.error(`Error while zipping: ${err}`)
        reject(err)
      })

      archive.on('progress', progress => {
        const percent =
          100 - (totalSize - progress.fs.processedBytes) / totalSize * 100
        if (percent - previousPercent > 0.5) {
          previousPercent = percent
          catalogStatus[locale].complete = 20 + percent * 0.6
          io.emit(WS_CATALOG_STATUS, catalogStatus)
          logger.debug(
            `${bytesToSize(
              progress.fs.processedBytes
            )} / ${prettyTotalSize} (${percent} %)`
          )
        }
      })

      // on stream closed we can end the request
      archive.on('end', () => {
        const archiveSize = archive.pointer()
        catalogStatistics.size = bytesToSize(archiveSize)
        logger.info(`CATALOG FOR LANGUAGE ${locale.toUpperCase()} CREATED`)
        logger.debug(`${prettyTotalSize} / ${prettyTotalSize} (100 %) `)
        logger.debug(`Archiver wrote %s bytes ${catalogStatistics.size}`)
        logger.debug(
          `Compression ratio: ${Math.round(totalSize / archiveSize)}:1`
        )
        logger.debug(`Space savings: ${(1 - archiveSize / totalSize) * 100} %`)
        // publish
        resolve()
      })

      archive.pipe(destinationStream)
      archive.directory(directory, 'ARASAAC')
      archive.finalize()
    })
  })

/**
 * You can use a nodejs module to do this, this function is really straightforward and will fail on error
 * Note that when computing a directory size you may want to skip some errors (like ENOENT)
 * That said, this is for demonstration purpose and may not suit a production environnment
 */
const directorySize = (path, cb, size) => {
  if (size === undefined) {
    size = 0
  }

  fs.stat(path, function (err, stat) {
    if (err) {
      cb(err)
      return
    }

    size += stat.size

    if (!stat.isDirectory()) {
      cb(null, size)
      return
    }

    fs.readdir(path, function (err, paths) {
      if (err) {
        cb(err)
        return
      }

      async.map(
        paths.map(function (p) {
          return path + '/' + p
        }),
        directorySize,
        function (err, sizes) {
          size += sizes.reduce(function (a, b) {
            return a + b
          }, 0)
          cb(err, size)
        }
      )
    })
  })
}

/**
 * https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript#18650828
 */
const bytesToSize = bytes => {
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes == 0) return '0 Byte'
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
}

module.exports = {
  compressDirToZip
}