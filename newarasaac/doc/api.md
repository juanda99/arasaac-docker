# API docs
These are the docs about how to test & code our API. Just for developers!

API resources:
- Users: WIP
- Materials: WIP
- Pictograms: Not started


## Swagger config
- We use [Swagger](https://swagger.io/) to generate our API docs
- JSON config file: https://api.arasaac.org/arasaac.json
- You can test our API using swagger-ui: 
  - Testing locally: http://localhost:3000/developers/api
  - Testing from our server: https://beta.arasaac.org/developers/api

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


