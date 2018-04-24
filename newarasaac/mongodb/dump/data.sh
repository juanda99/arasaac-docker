mongoimport --db arasaac --collection materials --file /docker-entrypoint-initdb.d/materials.json --jsonArray
mongoimport --db arasaac --collection keywords --file  /docker-entrypoint-initdb.d/words.json  --jsonArray
mongoimport --db arasaac --collection clients --file  /docker-entrypoint-initdb.d/clients.json  --jsonArray
mongoimport --db arasaac --collection users --file  /docker-entrypoint-initdb.d/users.json  --jsonArray
#mongoimport --db arasaac --collection pictograms --file  /docker-entrypoint-initdb.d/pictograms.json  --jsonArray
#mongoimport --db arasaac --collection tests --file  /docker-entrypoint-initdb.d/tests.json  --jsonArray
mongoimport --db arasaac --collection pictos_ar --file /docker-entrypoint-initdb.d/pictos_ar.json
mongoimport --db arasaac --collection pictos_bg --file /docker-entrypoint-initdb.d/pictos_bg.json
mongoimport --db arasaac --collection pictos_en --file /docker-entrypoint-initdb.d/pictos_en.json
mongoimport --db arasaac --collection pictos_es --file /docker-entrypoint-initdb.d/pictos_es.json
mongoimport --db arasaac --collection pictos_pl --file /docker-entrypoint-initdb.d/pictos_pl.json
mongoimport --db arasaac --collection pictos_ro --file /docker-entrypoint-initdb.d/pictos_ro.json
mongoimport --db arasaac --collection pictos_ru --file /docker-entrypoint-initdb.d/pictos_ru.json
mongoimport --db arasaac --collection pictos_zh --file /docker-entrypoint-initdb.d/pictos_zh.json
#mongorestore -d arasaac pictos/
mongo localhost:27017/arasaac /docker-entrypoint-initdb.d/indexes.js
