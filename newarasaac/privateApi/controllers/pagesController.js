const path = require('path')
const fs = require('fs-extra')
const Materials = require('../models/Material')
const { MATERIAL_DIR } = require('../utils/constants')
const logger = require('../utils/logger')

const getMaterial = async (req, res) => {
  logger.debug(`EXEC page controller getMaterial`)
  const { language, idMaterial } = req.params
  try {
    const material = await Materials.findOne({ idMaterial })
    if (!material) {
      logger.debug(`Not found material for id: ${idMaterial}`)
      return res.status(404).json({})
    }
    const currentTranslation = material.translations.filter(translation => translation.lang === language)[0]
    /* get image */
    let image = null
    let baseDir = path.resolve(MATERIAL_DIR, material.idMaterial.toString(), 'screenshots_300')
    const files = fs.readdirSync(baseDir)
    for (var i in files) {
      if (path.extname(files[i]).toLowerCase() === '.png' || path.extname(files[i]).toLowerCase() === '.jpg') {
        image = encodeURI(`https://static.arasaac.org/materials/${idMaterial}/screenshots_300/${files[i]}`)
        break
      }
    }
    /* if not image we provide default image */
    if (!image) {
      image = 'https://static.arasaac.org/images/arasaac-logo.png'
    }
    const { title, desc } = currentTranslation
    // console.log(currentTranslation, '***********s')
    res.render('material', { title, desc, image, language, idMaterial })
  } catch (error) {
    logger.error(
      `Error executing getmaterial in page controller. See error: ${error.message}`
    )
    return res.status(500).json({
      error: error.message
    })
  }
}

module.exports = {
  getMaterial
}
