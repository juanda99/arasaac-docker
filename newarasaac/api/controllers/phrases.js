const request = require('request')

module.exports = {
  getFlex: function (req, res) {
    // const language = req.swagger.params.language.value
    const phrase = req.swagger.params.phrase.value
    const url = `http://freeling:5000/flexionar?frase=${phrase}`
    request(url, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        res.json(body)
      } else {
        return res
          .status(500)
          .json({ error: error.message || response.statusCode })
      }
    })
  },
}
