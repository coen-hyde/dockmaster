var async = require('async')
  , _ = require('lodash')
  , debug = require('debug')('dockmaster');

module.exports = dockmaster = function(ports, options) {
  var options = options || {}

  _.defaults(options, {
    selector: 'random'
  });

  return function (req, res, next) {
    var services = ports.services.toJSON();

    // Filter the matching services via host headersort by path
    var matchingServices = _.filter(services, function(service) {
      if (typeof service.noroute !== 'undefined' && service.noroute) {
        return false;
      }

      if (typeof service.domains === 'undefined' || !_.isArray(service.domains)) {
        return false;
      }

      return (service.domains.indexOf(req.headers.host.split(':')[0]) > -1);
    });

    // Set default mount point
    _.map(matchingServices, function(service){
      _.defaults(service, {'mount': '/'});
    });

    // Filter the matching services via the path
    matchingServices = _.sortBy(_.filter(matchingServices, function(service) {
      return (req.url.substr(0, service.mount.length) === service.mount);
    }), 'mount').reverse();
    
    // Pick the service with the best match, then find all other services that have the same mount
    matchingServices = _.filter(matchingServices, function(service) {
      return (service.mount === matchingServices[0].mount)
    });

    // Route request to app
    if (matchingServices.length > 0) {
      var selector = function(services) {
        return matchingServices[_.random(services.length-1)]
      };

      var service = selector(matchingServices);

      // Modify the url to remove the mount point
      req.url.substr(service.mount.length);

      // Make url absolute if it isn't already
      if (req.url.length === 0 || req.url[0] === '/') {
        req.url = '/'+req.url;
      }

      if (service) {
        debug('routing to port: %d', service.port);
        return next(service.port);
      }
    }

    // No app found
    next();
  }
}