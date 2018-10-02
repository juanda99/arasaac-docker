const Materials = require('../models/materials')
const formidable = require('formidable')
const { saveFilesByType } = require('./utils')

module.exports = {
  create: (req, res) => {
    const form = new formidable.IncomingForm()
    form.encoding = 'utf-8'
    form.keepExtensions = true
    form.multiples = true
    // form.uploadDir = `${__dirname}/uploads`
    form.parse(req, async (err, fields, files) => {
      let material
      const formData = JSON.parse(fields.formData)
      if (!formData.translations) {
        return res.status(422).json({
          error: 'It neeeds at least title and desc in one language'
        })
      }
      const { translations } = formData
      const originalData = translations.shift()
      // const originalData = translations.slice(0, 1)
      // set lang if needed (not only language)
      const data = { ...formData, translations, ...originalData }
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
        console.log(err)
        return res.status(500).json({
          message: 'Error saving material',
          error: err
        })
      }
    })
  },
  update: (req, res) => {
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
  },
  delete: (req, res) => {
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
}
