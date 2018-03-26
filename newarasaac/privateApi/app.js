const express = require('express')
const formidable = require('formidable')
const app = express()

const port = process.env.port || 4000

/* bbdd config */
require('./db')

app.use(cors())
app.set('etag', false)

app.post('/materials', (req, res, next) => {
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
      next(err)
    })
    .on('end', () => {
      // we move files to the proper directory
      // save to mongoDB and move files to proper directory
      res.end()
    })

  res.setHeader('Content-Type', 'application/json')
  res.json({ message: 'todo ok' })
})

app.listen(3001, () => {
  console.log(`App running on port ${port}`)
})

module.exports = app // for testing
