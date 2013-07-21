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
      , domains: ['domain.test']
      }
    , {
        role: 'admin'
      , domains: ['domain.test']
      , mount: '/admin'
      }
    , {
        role: 'api'
      , domains: ['domain.test']
      , mount: '/api'
      }
    , {
        role: 'assets'
      , domains: ['assets.domain.test']
      }
    , {
        role: 'postal-1'
      , mount: '/path'
      , domains: ['postal.domain.test']
      }
    , {
        role: 'postal-2'
      , mount: '/path'
      , domains: ['postal.domain.test']
      }
    ]

    services = [];

    async.forEach(clientMeta, function(client, next) {
      var service = seaport.connect(masterSeaport);
      service.register(client.role, client); 
      service.on('host', function() {
        next();
      });

      services.push(service);
    }, setTimeout.bind(null, done, 100));
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

  it('should randomly select service matching service when there are more than one matching service', function(done) {
    var count = {}
      , middleware = dockmaster(services[0])
      , loops = [];

    // Select a service 1000 times and see if random selection distributes service selection enough
    for (var i = 0; i < 1000; i++) {
      loops.push(function(next) {
        var req = function() {}
          , res = function() {};

        _.extend(req, {
          'headers': {'host': 'postal.domain.test'}
        , 'url': '/path'
        });

        middleware(req, res, function(port) {
          service = _.find(services[0].services.toJSON(), function(service) {
            return (service.port === port)
          });

          if (typeof count[service.role] === 'undefined') {
            count[service.role] = 1
          }
          else {
            count[service.role]++;
          }

          next();
        });
      });
    }

    async.parallel(loops, function() {
      count['postal-1'].should.be.above(400);
      count['postal-1'].should.be.below(600);
      count['postal-2'].should.be.above(400);
      count['postal-2'].should.be.below(600);
      done();
    });
  })
});