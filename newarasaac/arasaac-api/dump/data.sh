 mongoimport --db arasaac --collection materials --file /docker-entrypoint-initdb.d/materials.json --jsonArray
 mongoimport --db arasaac --collection keywords --file  /docker-entrypoint-initdb.d/words.json  --jsonArray
