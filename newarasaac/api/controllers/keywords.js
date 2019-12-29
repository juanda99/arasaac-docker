const Keywords = require('../models/Keyword')
module.exports = {
  getAll: function (req, res) {
    var language = req.swagger.params.language.value
    Keywords.findOne({ language }, (err, keywords) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      return res.json(keywords)
    })
  }
}
