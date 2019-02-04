db = db.getSiblingDB('arasaac')
const languages = ['ar', 'bg', 'br', 'ca', 'hr', 'de', 'en', 'es', 'eu', 'fr', 'gl', 'it', 'pl', 'pt', 'ro', 'ru', 'va', 'zh'];
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
