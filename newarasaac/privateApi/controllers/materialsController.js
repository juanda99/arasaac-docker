const Materials = require('../models/materials')
const formidable = require('formidable')

module.exports = {
  create: (req, res, next) => {
    const form = new formidable.IncomingForm()
    form.encoding = 'utf-8'
    form.uploadDir = `${__dirname}/uploads`
    form
      .parse(req)
      .on('fileBegin', (name, file) => {
        console.log(`upfile file to ${__dirname}/uploads/${file.name}`)
      })
      .on('file', (name, file) => {
        console.log(name)
        // console.log(file)
        console.log(`Uploaded ${file.name}`)
      })
      .on('field', (name, field) => {
        console.log(`Got a field:, ${name} - ${field}`)
      })
      .on('error', err => {
        return res.status(500).json({
          message: 'Error al leer el fichero',
          error: err
        })
      })
      .on('end', () => {
        // we move files to the proper directory
        // save to mongoDB and move files to proper directory
        res.end()
      })

    const material = new Materials(req.body)
    material.save((err, material) => {
      if (err) {
        return res.status(500).json({
          message: 'Error al guardar el material',
          error: err
        })
      }
      return res.status(201).json({
        message: 'saved',
        _id: material._id
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
