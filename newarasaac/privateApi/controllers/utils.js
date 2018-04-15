const fs = require('fs-extra')
const path = require('path')
const MATERIALS = process.env.MATERIALS || '/app/materials'

const saveFiles = async (files, dir) => {
  await fs.ensureDir(dir)
  if (Array.isArray(files)) {
    return Promise.all(
      files.map(file => {
        const destDir = path.resolve(dir, file.name)
        return fs.move(file.path, destDir)
      })
    )
  }
  const destDir = path.resolve(dir, file.name)
  return fs.move(file.path, destDir)
}

module.exports = {
  saveFilesByType: async (formFiles, id) => {
    const filePromises = []
    let filesPromise
    let screenshotsPromise
    const langFilesPattern = new RegExp(`^[A-z]{2,3}langFiles$`, 'i')
    const langScreenshotsPattern = new RegExp(
      `^[A-z]{2,3}langScreenshots$`,
      'i'
    )

    if (formFiles.files) {
      filePromise = saveFiles(
        formFiles.files, 
        path.resolve(MATERIALS, `${id}`, 'files')
      )
    }

    if (formFiles.screnshots) {
      screenshotsPromise = saveFiles(
        formFiles.screenshots,
        path.resolve(MATERIALS, `${id}`, 'files')
      )
    }

    const langFiles = Object.keys(formFiles).filter(key =>
      langFilesPattern.test(key)
    )

    const langFilesPromises = langFiles.map(langFile => {
      const locale = langFile.substr(0, langFile.indexOf('langFile'))
      return saveFiles(
        formFiles[langFile],
        path.resolve(MATERIALS, `${id}`, locale, 'files')
      )
    })

    const langScreenshotsFiles = Object.keys(formFiles).filter(key =>
      langScreenshotsPattern.test(key)
    )

    const langScreenshotsPromises = langScreenshotsFiles.map(langScreenshot => {
      const locale = langScreenshot.substr(
        0,
        langScreenshot.indexOf('langScreenshot')
      )
      return saveFiles(
        formFiles[langScreenshot],
        path.resolve(MATERIALS, `${id}`, locale, 'screenshots')
      )
    })

    return Promise.all([
      filesPromise,
      screenshotsPromise,
      ...langFilesPromises,
      ...langScreenshotsPromises
    ])
  }
}
