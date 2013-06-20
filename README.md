Dockmaster
==========

Docmaster is a vhost middleware router for Distribute that uses Seaport to intelligently route requests.

Usage
-------

### Router
```js
var http = require('http')
  , distribute = require('distribute')
  , seaport = require('seaport')
  , dockmaster = require('docmaster');

// Connect to the Seaport server
var ports = require('seaport').connect(5000);

/*
 * Create the httpServer and register it with Seaport. 
 * The noroute attribute passed to seaport will prevent Docmaster routing to it's self.
 */
var httpServer = http.createServer().listen(
  ports.register('router', {noroute: true})
);

// Wrap the httpServer with distribute
var router = distribute(httpServer);

// Use the Dockmaster middleware
router.use(dockmaster(ports));
```

### Applications
For the above router to route to your apps you will need to register your applications with Seaport. As so:

```js
var http = require('http')
  , express = require('express')
  , seaport = require('seaport');

// Connect to the Seaport server
var ports = require('seaport').connect(5000)

// Create your app and register it with Seaport
var app = express();
app.listen(ports.register('router', {vhost: {serverName: 'myvhost.domain'}}));
```

You can also mount applications on paths so you can have multiple applications sharing the same domain.

```js
var app = express();
app.listen(ports.register('router', { vhost: {serverName: 'myvhost.domain', mount: '/admin' }}));
```

License
-------

MIT
