# arasaac-docker

## Project files

Arasaac project installation repo, based on two other repos:
- [arasaac-frontend](https://github.com/juanda99/arasaac-frontend): Our client code, based on React.
- [api-arasaac](https://github.com/juanda99/api-arasaac): Our backend code based on node.js, express, swagger-ui and mongodb.


Both projects are located in *newarasaac* folder:
- *code*: it has all the client code built. Source repo is https://github.com/juanda99/arasaac-frontend and code is generated running ``` npm run build``` periodically 
  - How to update code:
    - Execute ```npm run build``` in source repo and move it to this repo code folder.  It's done periodically as we improve our software. No releases yet :-(
- *api-arasaac*: submodule from  our repo [api-araasaac](https://github.com/juanda99/api-arasaac)
  - How to update code: 
```
  git submodule foreach git pull origin master
```
- *docker-compose.yml*: docker configuraton file for the following services:
  - *newarasaac*: nginx container for our client code. Connected to our proxy and certificates using env variables:
```
 LETSENCRYPT_HOST: "beta2.arasaac.org"
 LETSENCRYPT_EMAIL: "juandacorreo@gmail.com"
VIRTUAL_HOST: "beta2.arasaac.org"
```
  - *apidocs*: container with generates swagger-ui interfaced based on swagger.json file
  - *apiarasaac*: api server container
  - *mongodb*: database container


## Server configuration
Located in *nginx-proxy* folder. Based on docker it runs two services:
- nginx-proxy: [Automated nginx proxy for Docker](https://github.com/jwilder/nginx-proxy) based on VIRTUAL_HOST env variable
- letsencrypt; automates free SSL server certificate generation and renewal processes



