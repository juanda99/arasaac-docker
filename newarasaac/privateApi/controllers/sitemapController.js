const path = require('path')
const { createReadStream, createWriteStream } = require('fs');
const { resolve } = require('path');
const { createGzip } = require('zlib')
const { Readable } = require('stream')
const {
  SitemapAndIndexStream,
  SitemapStream
} = require('sitemap')
const Pictogram = require('../models/Pictogram')
const Material = require('../models/Material')
const logger = require('../utils/logger')
const languages = require('../utils/languages')
const CustomError = require('../utils/CustomError')


const createSitemap = async (req, res) => {

  const sitemapItems = [
    { url: '/', changefreq: 'daily', priority: 1},
    { url: '/pictograms/search/', changefreq: 'daily', priority: 0.9},
    { url: '/pictograms/favorites/', changefreq: 'daily', priority: 0.6},
    { url: '/materials/search/', changefreq: 'daily', priority: 0.9},
    { url: '/materials/upload/', changefreq: 'daily', priority: 0.6},
    { url: '/lse/search/', changefreq: 'daily', priority: 0.8},
    { url: '/developers/', changefreq: 'daily', priority: 0.1},
    { url: '/dvelopers/api/', changefreq: 'daily', priority: 0.1},
    { url: '/settings/', changefreq: 'daily', priority: 0.1},
    { url: '/terms-of-use/', changefreq: 'daily', priority: 0.1},
    { url: '/about-us/', changefreq: 'daily', priority: 0.4},
    { url: '/world/', changefreq: 'daily', priority: 0.1},
    { url: '/prizes/', changefreq: 'daily', priority: 0.1},
    { url: '/translators/', changefreq: 'daily', priority: 0.3},
    { url: '/contact-us/', changefreq: 'daily', priority: 0.4}, 
  ]

  languages.forEach(language => {
    sitemapItems.push({ url: `/aac/${language}`, changefreq: 'daily', priority: 0.9})
    sitemapItems.push({ url: `/aac-users/${language}`, changefreq: 'daily', priority: 0.9})
    sitemapItems.push({ url: `/use-of-aac/${language}`, changefreq: 'daily', priority: 0.9})
    /* now materials */

    /* now pictograms */

  });

    /* generate file with url list */

  try {
    logger.debug(`Generating sitemap...`)

    const sms = new SitemapAndIndexStream({
      limit: 50000, // defaults to 45k
      // SitemapAndIndexStream will call this user provided function every time
      // it needs to create a new sitemap file. You merely need to return a stream
      // for it to write the sitemap urls to and the expected url where that sitemap will be hosted
      getSitemapStream: (i) => {
        const sitemapStream = new SitemapStream({ hostname: 'https://arasaac.org' });
        const path = `./sitemap-${i}.xml`;
    
        sitemapStream
          .pipe(createGzip()) // compress the output of the sitemap
          .pipe(createWriteStream(resolve(path + '.gz'))); // write it to sitemap-NUMBER.xml
    
        return [new URL(path, 'https://example.com/subdir/').toString(), sitemapStream];
      },
    });
  
    sms
    .pipe(createGzip())
    .pipe(createWriteStream(resolve('./sitemap-index.xml.gz')));
    

    Readable.from(sitemapItems).pipe(sms) // available as of node 10.17.0
    // or
    sitemapItems.forEach(item => sms.write(item))
    sms.end() // necessary to let it know you've got nothing else to write
    return res.json({message: 'Sitemap generated!'})

  } catch (err) {
    logger.error(`ERROR CREATING SITEMAP: ${err.message}`)
    return res.status(err.httpCode || 500).json({
      message: 'Error generating sitemap. See error field for detail',
      error: err.message
    })
  }

}

module.exports = {
  createSitemap
}
