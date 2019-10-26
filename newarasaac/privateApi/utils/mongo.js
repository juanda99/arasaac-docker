/*
convert an object to its dot representation for mongodb
see: https://stackoverflow.com/questions/51847779/how-to-update-nested-object-of-mongoose-document-for-only-provided-keys
*/
const objectToDotNotation = (obj, newObj = {}, prefix = '') => {
  for (let key in obj) {
    if (typeof obj[key] === 'object') {
      objectToDotNotation(obj[key], newObj, prefix + key + '.')
    } else {
      newObj[prefix + key] = obj[key]
    }
  }
  return newObj
}

/*
  Returns object keys recursively:
  const prueba = {
    pepito: {
      jaimito: "2345"
    }
  };
  would return ['pepito', 'pepito.jaimito']
*/
const objectDeepKeys = obj => {
  return Object.keys(obj)
    .filter(key => obj[key] instanceof Object)
    .map(key => objectDeepKeys(obj[key]).map(k => `${key}.${k}`))
    .reduce((x, y) => x.concat(y), Object.keys(obj))
}

const getObjectLastDeepKey = obj => {
  const arrayKeys = objectDeepKeys(obj)
  return arrayKeys[arrayKeys.length - 1]
}

module.exports = {
  objectToDotNotation,
  getObjectLastDeepKey
}
