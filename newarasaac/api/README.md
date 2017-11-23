

<div align="center">
<p><strong>WIP!!!!!</strong></p>
  <img width=200 src="https://cdn.rawgit.com/juanda99/arasaac-frontend/master/app/components/Welcome/arasaac-logo.svg" alt="Arasaac logo" align="center" />
</div>
<br />

<div align="center"><strong>Arasaac API</strong></div>
<div align="center">We're using it in <a href="https://github.com/juanda99/arasaac-frontend"> our new Arasaac website project</a></div>

# API for new Arasaac Project

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



### Read the API documentation

- [http://localhost:8100/api-docs/](http://localhost:8100/api-docs/)
- Port changing hast to be done in two files:
    - config/index.js
    - api/swagger.yaml


### Api usage
- URL: [http://localhost:8100/api/](http://localhost:8100/api/)
- Check the [api docs](http://localhost:8100/api-docs/)


### Add new routes
- Through the swagger editor, using the command line:
```
cd app
swagger project edit
```

## License

This project is licensed under the MIT license, Copyright (c) 2016 . For more information see `LICENSE.md`.

## Supporters
<img src="http://arasaac.org/images/logoAragon.jpg" alt="Gobierno de Aragón" align="left" />
<img src="http://arasaac.org/images/logo_fse.jpg" alt="European Union" align="right" />


