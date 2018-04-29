db = db.getSiblingDB('arasaac');
const languages = [
  "es",
  "ru",
  "ro",
  "ara", // instead of ar
  "zhs", // instead of zh, zhs simplified chineese zht traditional chineese
  "bg", // not available
  "pl", // not available
  "en",
  "fr",
  "ca", // not available
  "eu", // not available
  "de",
  "it",
  "pt",
  "ga", // not available
  "br", // not available, should we use pt?
  "cr", // not available
  "val" // not available
];
/*
const notAvailableLanguages = [
  "ara", // available with mongodb enterprise and Basis Technology Rosette Linguistics Platform, see: https://docs.mongodb.com/manual/tutorial/text-search-with-rlp/
  "zhs", // available with mongodb enterprise and Basis Technology Rosette Linguistics Platform, see: https://docs.mongodb.com/manual/tutorial/text-search-with-rlp/
  "bg",
  "pl",
  "ca",
  "eu",
  "ga",
  "cr",
  "val"
]
*/

languages.forEach(language => {
  const collectionName = `pictos_${language}`
  /*var defaultLanguage
  if (notAvailableLanguages.includes(language)){
    defaultLanguage="none"
  }
  else if (language==="br") {
    defaultLanguage="pt"
  }
  else {
    defaultLanguage=language
  }
  */
  // indexes without stemming for pictos, more accurate
  const defaultLanguage='None'
  const indexName = `text_${language}_${defaultLanguage}`
  db[collectionName].createIndex(
    { "keywords.keyword": "text", "tags": "text"},
    {
      "weights":
        { "keywords.keyword": 10, "tags":1 },
      "default_language": defaultLanguage,
      "name": `text_${language}_${defaultLanguage}`
    }
  );
});