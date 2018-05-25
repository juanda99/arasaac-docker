db = db.getSiblingDB('arasaac')
const languages = ['ar', 'bg', 'br', 'ca', 'cr', 'de', 'en', 'es', 'eu', 'fr', 'ga', 'it', 'pl', 'pt', 'ro', 'ru', 'val', 'zh'];
languages.forEach(language => {
  const collectionName = `pictos_${language}`
  db[collectionName].createIndex(
    { "keywords.keyword": "text", "tags": "text"},
    {
      "weights":
        { "keywords.keyword": 10, "tags":1 },
      "default_language": "None"
    }
  );
});
