# Arasaac API
These are the docs about how to test & code our API. 

If you need to use our API, you should use previous API (we can send you docs through email arasaac@gmail.com)


## Ingredients for the API
<dl>
  <dt>Server language</dt>
  <dd><a href="https://nodejs.org)">nodeJS</a>JavaScript for the server Side</dd>
  
  <dt>Web Server</dt>
  <dd><a href="http://expressjs.com">Express</a>: Fast, unopinionated, minimalist web framework for Node.js</dd>
  
  <dt>API Framework</dt>
  <dd><a href="http://swagger.io/">Swagger</a>: World’s largest framework of API developer tools for the OpenAPI Specification(OAS)</dd>

  <dt>Database</dt>
  <dd><a href="https://www.mongodb.com/">MongoDB</a>: a document database (no relational)</dd>

  <dt>Authentication</dt>
  <dd>JWT, user/password and social logins</dd>

</dl>



## Quick start

### Run the API Server
Using docker-compose, [see how to install](https://docs.docker.com/compose/install/)
```
git clone https://github.com/juanda99/api-arasaac
cd api-arasaac
docker-compose build --no-cache # in case of changes
docker-compose up -d
```
- Now you can access the API:
  - Api docs: http://localhost:8002
  - Check the api: http://localhost:8001/api

- Without docker you should install all the packages
We are using yarn, [see how to install](https://yarnpkg.com/lang/en/docs/install/)
```
git clone https://github.com/juanda99/api-arasaac
cd api-arasaac/app
yarn install
yarn start
```



## How to read the API documentation

- We use [Swagger](https://swagger.io/) to generate our API docs
- JSON config file: https://api.arasaac.org/arasaac.json
- You can test our API using swagger-ui: 
  - Testing locally: http://localhost:3000/developers/api
  - Testing from our server: https://beta.arasaac.org/developers/api




## Add new endpoints
- Through the swagger editor, using the command line:
```
cd newarasaac/api
npm run edit
```



## How to debug API using docker
- We use *yarn debug* in docker-compose.yml instead of *yarn start*
- We open port 9229, both in API docker and in HOST (see *docker-compose.yml*)
- Launch Debugger from vscode with this configuration:

```
{
  "version": "0.2.0",
  "configurations": [
  {
    "type": "node",
    "request": "attach",
    "name": "Docker: Attach to Node",
    "port": 9229,
    "address": "localhost",
    "sourceMaps": true,
    "localRoot": "${workspaceFolder}/app",
    "remoteRoot": "/app",
    "protocol": "inspector"
  }
  ]
}
```


