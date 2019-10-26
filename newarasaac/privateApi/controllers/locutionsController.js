const filenamify = require('filenamify')

const getLocutionById = (req, res) => {
  const { id, locale, keyword } = req.params
  try {
    const locution = `/app/locutions/${locale}/${id}`
    let locutionName = filenamify(keyword, { replacement: '' }) || `{$id}.mp3`
    res.download(locution, locutionName)
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      message: 'Error getting locution. See error field for detail',
      error: err
    })
  }
}

module.exports = {
  getLocutionById
}
