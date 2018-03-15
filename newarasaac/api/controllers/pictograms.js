var Pictograms = require('../models/Pictograms')

module.exports = {
  getPictogramById: (req, res) => {
    var id = req.swagger.params.idPictogram.value
    // Use lean to get a plain JS object to modify it, instead of a full model instance
    Pictograms.findOne({_id: id}).lean().exec( (err, pictogram) => {
      if(err) {
        return res.status(500).json({
          message: 'Se ha producido un error al obtener el pictogram',
          error: err
        })
      }
      if(!pictogram) {
        return res.status(404).json( {
          message: 'No tenemos este pictograma',
          err
        })
      }
      return res.json(pictogram)
    })
  },
  searchPictograms: (req, res) => {
    var locale = req.swagger.params.locale.value
    var searchText = req.swagger.params.searchText.value
    Pictograms
      .find({ $text: { $search: searchText, $language: locale } }, {score: {$meta: 'textScore'}})
      .sort({'score': { '$meta': 'textScore'} })
      .lean()
      .exec ((err, pictograms) => {
        if(err) {
          return res.status(500).json({
            message: 'Error buscando el pictograma',
            error: err
          })
        } 
        // if no items, return empty array
        if (pictograms.length===0) return res.status(404).json([]) //send http code 404!!!
        return res.json(pictograms)
      })
  }
}

