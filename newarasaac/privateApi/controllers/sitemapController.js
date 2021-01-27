const path = require('path')
const { createReadStream, createWriteStream } = require('fs');
const { resolve } = require('path');
const { createGzip } = require('zlib')
const {
  SitemapStream,
  SitemapAndIndexStream
} = require('sitemap')
const setPictogramModel = require('../models/Pictogram')
const Material = require('../models/Material')
const logger = require('../utils/logger')
const languages = require('../utils/languages')
const CustomError = require('../utils/CustomError')
const {PUBLISHED} = require ('../utils/constants')

const Pictograms = languages.reduce((dict, language) => {
  dict[language] = setPictogramModel(language)
  return dict
}, {})

const createSitemap = async (req, res) => {

  const sitemapItems = [
    { url: '/', changefreq: 'daily', priority: 1},
    { url: '/pictograms/search/', changefreq: 'daily', priority: 0.9},
    { url: '/materials/search/', changefreq: 'daily', priority: 0.9},
    { url: '/materials/upload/', changefreq: 'daily', priority: 0.6},
    { url: '/lse/search/', changefreq: 'daily', priority: 0.8},
    { url: '/developers/', changefreq: 'daily', priority: 0.1},
    { url: '/developers/api/', changefreq: 'daily', priority: 0.1},
    { url: '/settings/', changefreq: 'daily', priority: 0.1},
    { url: '/terms-of-use/', changefreq: 'daily', priority: 0.1},
    { url: '/about-us/', changefreq: 'daily', priority: 0.4},
    { url: '/world/', changefreq: 'daily', priority: 0.1},
    { url: '/prizes/', changefreq: 'daily', priority: 0.1},
    { url: '/translators/', changefreq: 'daily', priority: 0.3},
    { url: '/contact-us/', changefreq: 'daily', priority: 0.4}, 
  ]

  // specific urlls by language
  languages.forEach(language => {
    sitemapItems.push({ url: `/aac/${language}`, changefreq: 'daily', priority: 0.9})
    sitemapItems.push({ url: `/aac-users/${language}`, changefreq: 'daily', priority: 0.9})
    sitemapItems.push({ url: `/use-of-aac/${language}`, changefreq: 'daily', priority: 0.9})
  })

  // pictograms urls
  const pictoCollections = await Promise.all(languages.map(async (language) => {
    const pictograms = await Pictograms[language].find({
      published: true
    }, {keywords: 1 }).lean()
    return {pictograms, language}
  }))
  
  pictoCollections.forEach(pictoCollection => {
    const { language, pictograms } = pictoCollection
    pictograms.forEach(picto => {
      const keyword = (picto.keywords && picto.keywords[0]) ? picto.keywords[0].keyword : ''
      if (keyword) sitemapItems.push({ url: `/pictograms/${language}/${picto._id}/${keyword}`, changefreq: 'monthly', priority: 0.2})
    })
  })

  const  materials =  await Material.find({ status: PUBLISHED }, {idMaterial: 1, "translations.lang": 1, _id: 0, }).lean()
  materials.forEach(material => {
    const { idMaterial, translations } = material
    translations.forEach(translation => sitemapItems.push({ url: `/materials/${translation.lang}/${idMaterial}`, changefreq: 'monthly', priority: 0.2}))
  })



  // materials urls

  try {
    logger.info(`Generating sitemap...`)
    const sms = new SitemapAndIndexStream({
      limit: 40000, // defaults to 45k
      // SitemapAndIndexStream will call this user provided function every time
      // it needs to create a new sitemap file. You merely need to return a stream
      // for it to write the sitemap urls to and the expected url where that sitemap will be hosted
      getSitemapStream: (i) => {
        const sitemapStream = new SitemapStream({
          hostname: 'https://arasaac.org/',
        });
        const path = `/sitemap/sitemap-${i}.xml`;

        const ws = createWriteStream(resolve(path + '.gz'));
        sitemapStream
          .pipe(createGzip()) // compress the output of the sitemap
          .pipe(ws); // write it to sitemap-NUMBER.xml

        return [
          new URL(path, 'https://arasaac.org/sitemap/').toString(),
          sitemapStream,
          ws,
        ]
      },
    })

    // // when reading from a file
    // lineSeparatedURLsToSitemapOptions(createReadStream('./your-data.json.txt'))
    //   .pipe(sms)
    //   .pipe(createGzip())
    //   .pipe(createWriteStream(resolve('./sitemap-index.xml.gz')));

    // or reading straight from an in-memory array
    sms
      .pipe(createGzip())
      .pipe(createWriteStream(resolve('/sitemap/sitemap-index.xml.gz')))


    sitemapItems.forEach((item) => sms.write(item))
    sms.end();
    logger.info(`Sitemap generated!`)

  } catch (err) {
    logger.error(`ERROR CREATING SITEMAP: ${err.message}`)
  }

}

module.exports = {
  createSitemap
}
