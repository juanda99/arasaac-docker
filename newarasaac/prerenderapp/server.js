#!/usr/bin/env node
const prerender = require('prerender');

// var server = prerender();
var server = prerender({
  chromeFlags: ['--no-sandbox', '--headless', '--disable-gpu', '--remote-debugging-port=9222', '--hide-scrollbars'],
  logRequests: true,
  followRedirects: true
});
server.use(require('prerender-memory-cache'));

server.use(prerender.sendPrerenderHeader());
// server.use(prerender.blockResources());
server.use(prerender.removeScriptTags());
server.use(prerender.httpHeaders());

server.start();