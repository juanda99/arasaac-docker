const Materials = require('../models/materials')
const formidable = require('formidable')

module.exports = {
  create: (req, res) => {
    const form = new formidable.IncomingForm()
    form.encoding = 'utf-8'
    form.keepExtensions = true
    form.multiples = true
    // form.uploadDir = `${__dirname}/uploads`
    form
      .parse(req, (err, fields, files) => {
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
        console.log(data)
        console.log('*************************')
        const Material = new Materials(data)
        console.log('kkkkkkkkkkkkkkkkkkk')
        Material.save((err, material) => {
          console.log(err)
          console.log(material)
          console.log('*************************')

          if (err) {
            return res.status(500).json({
              message: 'Error al guardar el material',
              error: err
            })
          }
          // mongodb saves data, so we move files to its dir
          // files, screenshots, {lang}_files, {lang}_screenshots
          // if files.files
          console.log(files)
          return res.status(201).json({
            id: material.idMaterial
          })
        })
      })
      // show progress with socket.io? better from client,
      // see: https://stackoverflow.com/questions/29659154/what-is-the-best-way-to-upload-files-in-a-modern-browser
      /*
      .on('progress', (bytesReceived, bytesExpected) => {
        console.log('Progress so far: '+(bytesReceived / bytesExpected * 100).toFixed(0)+"%")
      })
      */
      .on('error', err => {
        return res.status(500).json({
          message: 'Error al leer el fichero',
          error: err
        })
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
