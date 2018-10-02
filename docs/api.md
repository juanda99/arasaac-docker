
# ARASAAC API

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


## How to read the API documentation

- We use [Swagger](https://swagger.io/) to generate our API docs
- JSON config file: https://api.arasaac.org/arasaac.json
- You can test our API using swagger-ui: 
  - Testing locally using [Arasaac frontend](http://github.com/juanda99/arasaac-frontend): http://localhost:3000/developers/api
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


