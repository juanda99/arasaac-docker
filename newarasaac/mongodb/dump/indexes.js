db = db.getSiblingDB("arasaac");
const languages = [
  "an",
  "ar",
  "bg",
  "br",
  "ca",
  "de",
  "el",
  "en",
  "es",
  "eu",
  "fr",
  "gl",
  "hr",
  "he",
  "hu",
  "it",
  "mk",
  "nl",
  "pl",
  "pt",
  "ro",
  "ru",
  "sk",
  "sq",
  "val",
  "zh"
];
languages.forEach(language => {
  const collectionName = `pictos_${language}`;
  db[collectionName].createIndex(
    { "keywords.keyword": "text", tags: "text" },
    {
      weights: { "keywords.keyword": 10, tags: 1 },
      default_language: "None"
    }
  );
});
db.materials.createIndex(
  {
    "translations.title": "text",
    "translations.desc": "text"
  },
  {
    weights: {
      "translations.title": 3,
      "translations.desc": 1
    },
    default_language: "spanish",
    language_override: "language"
  }
);
