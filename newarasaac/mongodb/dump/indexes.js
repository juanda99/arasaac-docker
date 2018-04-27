db = db.getSiblingDB('arasaac')
db.materials.createIndex(
  { "title": "text", "desc": "text", "translations.title": "text", "translations.desc": "text"},
  {
    "weights":
      { "title": 10, "desc":1, "translations.title": 10, "translations.desc": 1 },
    "default_language": "spanish"
  }
);
const languages = ['es', 'ar'];
languages.forEach(language => {
  const collectionName = `pictos_${language}`
  db[collectionName].createIndex(
    { "keywords.keyword": "text", "tags": "text"},
    {
      "weights":
        { "keywords.keyword": 10, "tags":1 },
      "default_language": language
    }
  );
});
db.pictograms.createIndex(
  { "keywords.keyword": "text", "tags": "text"},
  {
    "weights":
      { "keywords.keyword": 10, "tags":1 },
    "default_language": "spanish"
  }
);
db.tests.createIndex(
  { "word": "text"},
  {
    "default_language": "spanish"
  }
);
