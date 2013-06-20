var async = require('async')
  , _ = require('lodash')
  , debug = require('debug')('dockmaster');

module.exports = dockmaster = function(ports) {

  return function (req, res, next) {
    var services = ports.query();

    // Find matching services via host header and sort by path
    var matchingServices = _.sortBy(_.filter(services, function(service) {
      if (!service.vhost) {
        return false;
      }
      var vhost = service.vhost;
      return (!vhost.noroute && !!vhost.serverName && req.headers.host.split(':')[0] === vhost.serverName);
    }), function(service) {
      if (!service.vhost.mount) {
        return 0;
      }

      return -service.vhost.mount.length; 
    });

    // Find the first matching app via path
    var matchingService = _.find(matchingServices, function(service) {
      var vhost = service.vhost;

      if (!vhost.mount) {
        return true;
      }

      if (!!vhost.mount && req.url.substr(0, vhost.mount.length) === vhost.mount) {
        req.url = req.url.substr(vhost.mount.length);
        return true;
      }
    });

    // Route request to app
    if (matchingService) {
      debug('routing to port: %d', matchingService.port);
      return next(matchingService.port);
    }

    // No app found
    next();
  }
}