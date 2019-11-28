db = db.getSiblingDB("arasaac");
const languages = [
  "ar",
  "bg",
  "br",
  "ca",
  "hr",
  "de",
  "en",
  "es",
  "eu",
  "fr",
  "gl",
  "it",
  "nl",
  "pl",
  "pt",
  "ro",
  "ru",
  "val",
  "zh"
];
languages.forEach(language => {
  const collectionName = `pictos_${language}`;
  db[collectionName].drop();
});
