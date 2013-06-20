var async = require('async')
  , _ = require('lodash')
  , debug = require('debug')('dockmaster');

module.exports = dockmaster = function(ports) {

  return function (req, res, next) {
    var services = ports.query();

    // Find matching services via host header and sort by path
    var matchingServices = _.sortBy(_.filter(services, function(service) {
      return (!service.noroute && !!service.serverName && req.headers.host.split(':')[0] === service.serverName);
    }), 'mount');

    // Find the first matching app via path
    var matchingService = _.find(matchingServices, function(service) {
      if (!service.mount) {
        return true;
      }

      if (!!service.mount && req.url.substr(0, service.mount.length) === service.mount) {
        req.url = req.url.substr(service.mount.length);
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