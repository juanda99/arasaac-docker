db = db.getSiblingDB('arasaac');
console.log('aaaaaaaaaaaaaaaa');
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