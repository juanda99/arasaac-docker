#mongoimport --db arasaac --collection users --file  /docker-entrypoint-initdb.d/users.json  --jsonArray
#mongoimport --db arasaac --collection pictograms --file  /docker-entrypoint-initdb.d/pictograms.json  --jsonArray
#mongoimport --db arasaac --collection tests --file  /docker-entrypoint-initdb.d/tests.json  --jsonArray
mongorestore --db arasaac --archive='/docker-entrypoint-initdb.d/arasaac-28112019_03:00.archive'

#mongoimport --db arasaac --collection materials --file /docker-entrypoint-initdb.d/materials.json --jsonArray
#mongoimport --db arasaac --collection keywords --file  /docker-entrypoint-initdb.d/words.json  --jsonArray
#mongoimport --db arasaac --collection clients --file  /docker-entrypoint-initdb.d/clients.json  --jsonArray
#mongoimport --db arasaac --collection synsets --file  /docker-entrypoint-initdb.d/synsets.json  --jsonArray
#mongo localhost:27017/arasaac /docker-entrypoint-initdb.d/indexes.js
# Uncomment next lines to import synsets:
#ls -1 ./synsets/*.json | while read col; do 
#     mongoimport --db arasaac --collection synsets --file $col --jsonArray; 
#     done
