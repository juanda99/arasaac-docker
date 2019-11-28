db = db.getSiblingDB("arasaac");
const languages = [
  "ar",
  "bg",
  "br",
  "ca",
  "de",
  "en",
  "es",
  "eu",
  "fr",
  "gl",
  "hr",
  "it",
  "iw",
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
    title: "text",
    desc: "text",
    "translations.title": "text",
    "translations.desc": "text"
  },
  {
    weights: {
      title: 3,
      desc: 1,
      "translations.title": 3,
      "translations.desc": 1
    },
    default_language: "spanish",
    language_override: "language"
  }
);
