const fs = require('fs-extra')
const path = require('path')
const MATERIALS = process.env.MATERIALS || '/app/materials'

const saveFiles = async (files, dir) => {
  await fs.ensureDir(dir)
  if (Array.isArray(files)) {
    return Promise.all(
      files.map(file => {
        const { filename, path, name } = file
        const destDir = path.resolve(path, name)
        return fs.move(filename, destDir)
      })
    )
  }
  const { filename, path, name } = files
  const destDir = path.resolve(path, name)
  return fs.move(filename, destDir)
}

module.exports = {
  saveFilesByType: async (formFiles, id) => {
    const filePromises = []
    const langFilesPattern = new RegExp(`^[A-z]{2,3}langFiles$`, 'i')
    const langScreenshotsPattern = new RegExp(
      `^[A-z]{2,3}langScreenshots$`,
      'i'
    )

    if (formFiles.files) {
      filePromises.push(
        saveFiles(formFiles.files, path.resolve(MATERIALS, id, 'files'))
      )
    }

    if (formFiles.screnshots) {
      filePromises.push(
        saveFiles(
          formFiles.screenshots,
          path.resolve(MATERIALS, id, 'screenshots')
        )
      )
    }

    const langFiles = Object.keys(formFiles).filter(key =>
      langFilesPattern.test(key)
    )

    const langFilesPromises = langFiles.map(langFile => {
      const locale = langFile.substr(0, langFile.indexOf('langFile'))
      return saveFiles(formFiles[langFile], path.resolve(MATERIALS, id, locale))
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
        path.resolve(MATERIALS, id, locale)
      )
    })

    return Promise.all(
      ...filePromises,
      ...langFilesPromises,
      ...langScreenshotsPromises
    )
  }
}
