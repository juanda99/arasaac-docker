# arasaac-docker

## Project files

Arasaac project installation repo, based on two other repos:
- [arasaac-frontend](https://github.com/juanda99/arasaac-frontend): Our client code, based on React.
- [api-arasaac](https://github.com/juanda99/api-arasaac): Our backend code based on node.js, express, swagger-ui and mongodb.


Both projects are located in *newarasaac* folder:
- **code**: it has all the client code built. Source repo is https://github.com/juanda99/arasaac-frontend and code is generated running ``` npm run build``` periodically 
  - How to update code:
    - Execute ```npm run build``` in source repo and move it to this repo code folder.  It's done periodically as we improve our software. No releases yet :-(
- **api-arasaac**: submodule from  our repo [api-araasaac](https://github.com/juanda99/api-arasaac)
  - How to update code: 
```
  git submodule foreach git pull origin master
```
- **docker-compose.yml**: docker configuraton file for the following services:
  - **newarasaac**: nginx container for our client code. Connected to our proxy and certificates using env variables:
```
 LETSENCRYPT_HOST: "beta2.arasaac.org"
 LETSENCRYPT_EMAIL: "juandacorreo@gmail.com"
 VIRTUAL_HOST: "beta2.arasaac.org"
```
  - **apidocs**: container with generates swagger-ui interfaced based on swagger.json file
  - **apiarasaac**: api server container
  - **mongodb*: database container


## Server configuration
Located in *nginx-proxy* folder. Based on docker it runs two services:
- nginx-proxy: [Automated nginx proxy for Docker](https://github.com/jwilder/nginx-proxy) based on VIRTUAL_HOST env variable
- letsencrypt; automates free SSL server certificate generation and renewal processes



## Local replication
- Create entries for domains in local. */etc/hosts* file:
```
127.0.0.1       www.api.arasaac.org             api.arasaac.org
127.0.0.1       www.beta2.arasaac.org           beta2.arasaac.org
```
- Clone repo and init submodule:
```
git@github.com:juanda99/arasaac-docker.git
cd arasaac-docker
git submodule update --init --recursive
```
- Copy certificates from server (*nginx-proxy/certs* folder)

- Execute ```./start.sh``` script to load all the containers.


## Problems
### Ports
- Web will be served by 443 port by default
- If there's any error with the certificates it will use 80 port **but api won't work**
- Any cache problem with ports, http and https, check *chrome://net-internals* HSTS (query and delete domain)
### Changes monitor
Arasaac-watcher uses inotify by default on Linux to monitor directories for changes. It's not uncommon to encounter a system limit on the number of files you can monitor. You can get your current inotify file watch limit by executing:
```
$ cat /proc/sys/fs/inotify/max_user_watches
```

When this limit is not enough to monitor all files inside a directory, the limit must be increased for Listen to work properly.

You can set a new limit temporary with:
```
$ sudo sysctl fs.inotify.max_user_watches=524288
$ sudo sysctl -p
```

If you like to make your limit permanent, use:

```
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```

You may also need to pay attention to the values of max_queued_events and max_user_instances if Listen keeps on complaining.
