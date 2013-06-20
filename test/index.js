var should = require('should')
  , async = require('async')
  , _ = require('lodash')
  , seaport = require('seaport')
  , http = require('http')
  , dockmaster = require('../')
  , ports
  , services
  , masterSeaport = 7099;

describe('Dockmaster', function() {
  before(function(done) {
    // Create Seaport server
    ports = seaport.createServer().listen(masterSeaport);

    // Create some services that connect to seaport
    var clientMeta = [
      {
        role: 'frontend'
      , host: 'domain.test'
      }
    , {
        role: 'admin'
      , host: 'frontend.test'
      , path: '/admin'
      }
    , {
        role: 'api'
      , host: 'domain.test'
      , path: '/api'
      }
    , {
        role: 'assets'
      , host: 'assets.domain.test'
      }
    ]

    services = [];

    async.forEach(clientMeta, function(client, next) {
      var service = seaport.connect(masterSeaport);
      service.register(client.role, client); 
      service.on('host', function(){
        next();
      });

      services.push(service);
    }, done);
  });

  var makeNext = function(service, cb) {
    return function(port) {
      should.exist(port);
      port.should.equal(services[0].query(service)[0].port);
      cb();
    }
  }

  it('simple vhost route', function(done) {
    var req = function() {}
      , res = function() {}
      , next = makeNext('assets', done);

    _.extend(req, {
      'headers': {'host': 'assets.domain.test'}
    , 'url': '/prettypicture.jpg'
    });

    dockmaster(services[0])(req, res, next);
  });

  it('vhost route with no path mount', function(done) {
    var req = function() {}
      , res = function() {}
      , next = makeNext('frontend', done);

    _.extend(req, {
      'headers': {'host': 'domain.test'}
    , 'url': '/awesomepage'
    });

    dockmaster(services[0])(req, res, next);
  });

  it('vhost route with path mount', function(done) {
    var req = function() {}
      , res = function() {}
      , next = makeNext('api', done);

    _.extend(req, {
      'headers': {'host': 'domain.test'}
    , 'url': '/api'
    });

    dockmaster(services[0])(req, res, next);
  });
});