var fs = require('fs')
var outputFilename = './pictos_en'
// const pictos = require("./pictos_en.json");
const pictos = require('./pictos_en.json')
const newPictos = pictos.filter((picto) => {
  /* fix picto_id */
  if (picto._id.$numberLong) picto._id = parseInt(picto._id.$numberLong)
  /* fix keywords numberLong */
  picto.keywords = picto.keywords.map((keyword) => {
    if (keyword.type && keyword.type.$numberLong) {
      keyword.type = parseInt(keyword.type.$numberLong)
    }
    return keyword
  })

  // picto.keywords = picto.keywords.map(keyword => {
  //   if (keyword.keyword && keyword.keyword !== null) {
  //     if (keyword.keyword.startsWith("to ")) {
  //       console.log(`Picto with to modified: ${picto._id}`);
  //       keyword.keyword = keyword.keyword.slice(3);
  //       return keyword;
  //     }
  //   }
  //   return keyword;
  // });

  picto.keywords = picto.keywords.filter(
    (keyword, index, self) =>
      self.findIndex(
        (t) => t.keyword === keyword.keyword && t.type === keyword.type
      ) === index
  )

  /* return results */
  return picto
})
fs.writeFile(outputFilename, JSON.stringify(newPictos, null, 4), (err) => {
  console.log(err)
})
// console.log(JSON.stringify(newPictos));
