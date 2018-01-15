# arasaac-docker

This is the backend server for the new Arasaac Project. Based on docker for better scaling.

## Project layout

### General server configuration
Located in *nginx-proxy* folder. Based on docker it runs two services:
- nginx-proxy: [Automated nginx proxy for Docker](https://github.com/jwilder/nginx-proxy) based on VIRTUAL_HOST env variable
- letsencrypt: automates SSL server certificate generation and renewal processes

- TODO: Add Varnish cache

### Project specific servers
Located in *newarasaac* folder. Based on docker it runs several services:
Arasaac project installation repo, based on two other repos:
- **frontend**: nginx service for all our javascript.
  - **code**: Our client code, based on React. Source repo is https://github.com/juanda99/arasaac-frontend and code is generated running ``` npm run build``` periodically. 
  - **conf**: nginx configuration
- [**api**](./api.md): Our backend code based on node.js, express, swagger-ui and mongodb.
- **watcher**: [Uses file system watchers](https://github.com/paulmillr/chokidar) and create zip files, compress images...
- **mongo**: mongodb service
- **materials**: nginx service that serve materials (located in materials folder). TODO: get pictos


## Local replication
- Create entries for domains in local. */etc/hosts* file:
```
127.0.0.1       www.api.arasaac.org            api.arasaac.org
127.0.0.1       www.beta.arasaac.org           beta.arasaac.org
127.0.0.1       www.static.arasaac.org         static.arasaac.org
```

- Copy certificates from server (*nginx-proxy/certs* folder)

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
