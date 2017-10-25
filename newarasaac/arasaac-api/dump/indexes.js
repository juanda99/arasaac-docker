db = db.getSiblingDB('arasaac')
db.materials.createIndex(
  { "title": "text", "desc": "text", "translations.title": "text", "translations.desc": "text"},
  {
    "weights":
      { "title": 10, "desc":1, "translations.title": 10, "translations.desc": 1 },
    "default_language": "spanish"
  }
);

