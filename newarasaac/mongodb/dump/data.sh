 mongoimport --db arasaac --collection materials --file /docker-entrypoint-initdb.d/materials.json --jsonArray
 mongoimport --db arasaac --collection keywords --file  /docker-entrypoint-initdb.d/words.json  --jsonArray
 mongoimport --db arasaac --collection clients --file  /docker-entrypoint-initdb.d/clients.json  --jsonArray
 mongoimport --db arasaac --collection users --file  /docker-entrypoint-initdb.d/users.json  --jsonArray
 mongoimport --db arasaac --collection users --file  /docker-entrypoint-initdb.d/pictograms.json  --jsonArray
