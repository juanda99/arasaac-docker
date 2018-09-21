# Arasaac server

This is the backend server for [beta Arasaac Project](https://beta.arasaac.org/).

## Project layout

We use docker for our development. 

### General server services

Located in *nginxproxy* folder. It runs two services (see *nginxproxy/docker-compose.yml*):
- nginx-proxy: [Automated nginx proxy for Docker](https://github.com/jwilder/nginx-proxy) based on VIRTUAL_HOST env variable
- letsencrypt: automates SSL server certificate generation and renewal processes

- TODO: Add Varnish cache

### Project specific services

Located in *newarasaac* folder. It runs several services (see *newarasaac/docker-compose.yml*):
- **frontend**: nginx service for [our SPA](https://github.com/juanda99/arasaac-frontend)
  - **code**: Our client code, based on React.
  - **conf**: nginx configuration
- **webstatic**: nginx service for Arasaac materials, pictograms and locutions.
- [**api**](./docs/api.md): Our backend api based on node.js, express, swagger-ui and mongodb. Used by Arasaac SPA and third apps.
- [**privateapi**](./docs/privateapi.md): Our backend private API.
- [**auth**](./docs/auth.md): Our auth server
- **svgwatcher**: [Uses file system watchers](https://github.com/paulmillr/chokidar) and convert svg files (pictograms) to png files
- **watcher**: [Uses file system watchers](https://github.com/paulmillr/chokidar) and generate zip files from materials uploaded by Arasaac users. Images are reduced and minified. 
- **mongo**: mongodb service
- **sftp**: sftp service to access material and svg folders.

## Local replication

- Create several entries in */etc/hosts* file to resolve domains locally:
```
127.0.0.1       www.api.arasaac.org            api.arasaac.org
127.0.0.1       www.beta.arasaac.org           beta.arasaac.org
127.0.0.1       www.static.arasaac.org         static.arasaac.org
```

- Copy certificates from server (*nginx-proxy/certs* folder) or execute:
``` 
cd newarasaac/ssh_keys
ssh-keygen -t ed25519 -f ssh_host_ed25519_key < /dev/null
ssh-keygen -t rsa -b 4096 -f ssh_host_rsa_key < /dev/null
```

- Execute ```./start.sh``` script to load all the containers.

- You can change urls and even decide not to use SSL. Just change api calls from [Arasaac frontend repo](https://github.com/juanda99/arasaac-frontend).

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
