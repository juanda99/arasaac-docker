const fs = require('fs-extra')
const Materials = require('../models/Material')
const formidable = require('formidable')
const logger = require('../utils/logger')
const { saveFilesByType } = require('./utils')
const { MATERIAL_DIR } = require('../utils/constants')

const create = (req, res, io) => {
  logger.debug(`EXEC create material`)
  const form = new formidable.IncomingForm()
  form.encoding = 'utf-8'
  form.keepExtensions = true
  form.multiples = true
  form.maxFileSize = 600 * 1024 * 1024 // 600MB instead of 200MB (default value)
  // form.uploadDir = `${__dirname}/uploads`
  let oldValue = 0
  form.on('progress', (bytesReceived, bytesExpected) => {
    let currentValue = (parseFloat(bytesReceived) / parseFloat(bytesExpected)) * 100
    if ((currentValue - oldValue) > 1 || currentValue === 100) {
      oldValue = currentValue
      io.emit('FILE_UPLOAD_STATUS', currentValue)
      console.log('FILE_UPLOAD_STATUS', currentValue)
    }
  })

  form.on('error', (err) => {
    logger.error(`Error updating pictogram: ${err.message}`)
  })

  form.parse(req, async (_err, fields, files) => {
    let material
    const formData = JSON.parse(fields.formData)
    if (!formData.translations) {
      logger.debug(`Invalid material, need at least title and desc in one language`)
      return res.status(422).json({
        error: 'It neeeds at least title and desc in one language'
      })
    }
    const { translations } = formData
    const originalData = translations.shift()
    // const originalData = translations.slice(0, 1)
    // set lang if needed (not only language)

    /* get id for material */
    // get last file id:
    const dirs = await fs.readdir(MATERIAL_DIR)
    /* filter only *.svg files with numeric basename */
    const materialDirs = dirs
      .filter(
        dirName =>
          !isNaN(dirName)
      )

    let idMaterial = Math.max(...materialDirs) + 1
    const data = { ...formData, translations, ...originalData, idMaterial }

    const Material = new Materials(data)
    try {
      material = await Material.save()
    } catch (err) {
      console.log(err)
      return res.status(500).json({
        message: 'Error al guardar el material',
        error: err
      })
    }
    try {
      await saveFilesByType(files, material.idMaterial)
      return res.status(201).json({
        id: material.idMaterial
      })
    } catch (err) {
      logger.error(`Error creating material: ${err}`)
      return res.status(500).json({
        message: 'Error saving material',
        error: err
      })
    }
  })
}

const update = (req, res) => {
  const { id } = req.params
  Materials.findOne({ _id: id }, (err, material) => {
    if (err) {
      return res.status(500).json({
        message: 'Se ha producido un error al guardar el material',
        error: err
      })
    }
    if (!material) {
      return res.status(404).json({
        message: 'No hemos encontrado la cerveza'
      })
    }
    material.title = req.body.title
    // next values....
    material.save((err, material) => {
      if (err) {
        return res.status(500).json({
          message: 'Error al guardar el material'
        })
      }
      if (!material) {
        return res.status(404).json({
          message: 'No hemos encontrado el material'
        })
      }
      return res.json(material)
    })
  })
}

const remove = (req, res) => {
  const { id } = req.params
  Materials.findByIdAndRemove(id, (err, material) => {
    if (err) {
      return res.json(500, {
        message: 'No hemos encontrado la cerveza'
      })
    }
    return res.json(material)
  })
}

module.exports = {
  create,
  update,
  remove
}
