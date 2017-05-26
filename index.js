const express = require('express');
const fs = require('fs');
const path = require('path');
const auth = require('./lib/auth');
const middleware = require('./lib/middleware');
const logger = require('./lib/logger')('init');

// Init our express app
const app = express();

// Get config an routes, then start the server
module.exports = Promise.all([
  require('./lib/config'),
  findAndCreateRoutes('./api')
]).then(([config, routes]) => {
  return new Promise((resolve, reject) => {
    // Config and routes have been initialized, start listening
    app.listen(config.server.port, () => {
      logger.info(`throtld now listening on port ${config.server.port}!`);
      resolve(app);
    });
    // Route debugging
    app.use((req, res) => {
      logger.trace(`Unhandled request: ${req.method} ${req.path}`);
    });
    // TODO: Add reject??? on fail?
  });
}, (err) => {
  logger.error(`throtld failed to start: ${err}`);
});

// Promise debugging
process.on('unhandledRejection', function unhandledPromise(reason) {
  logger.fatal(`Unhandled promise rejection: ${reason.stack}`);
  process.exit(1);
});

/**
 * Helper function to traverse a directory and create routes based on the files
 */
function findAndCreateRoutes(dirPath, parentRoute = []) {
  return new Promise((resolveRouteDir, rejectRouteDir) => {
    fs.readdir(dirPath, (readdirErr, files) => {
      if (readdirErr) {
        return rejectRouteDir(readdirErr);
      }
      // Find routes in this directory and sub route directories
      Promise.all(files.map(nodeName => new Promise((resolve, reject) => {
        const fullPath = `./${path.join(dirPath, nodeName)}`;
        fs.stat(fullPath, (statErr, stats) => {
          if (statErr) {
            return reject(statErr);
          }
          if (stats.isFile() && path.extname(nodeName) === '.js') {
            // This is most likely a route file, so lets process it
            return createRoute(fullPath, nodeName, parentRoute)
              .then(resolve, reject);
          } else if (stats.isDirectory()) {
            // Look through the routes in this directory
            return findAndCreateRoutes(fullPath, [...parentRoute, nodeName])
              .then(resolve, reject);
          }
          // Not an issue, just a file to ignore
          logger.warn(
            `Found bad route file while processing routes: ${fullPath}`);
          resolve(null);
        });
      }))).then(routes => {
        // Filter out bad files that did not resolve to routes
        resolveRouteDir(routes.filter(el => !!el));
      }, rejectRouteDir);
    });
  });
}

/**
 * Helper function to create an express route based on a path
 */
function createRoute(filePath, fileName, parentRoute) {
  return new Promise((resolve, reject) => {
    let routeName, routeMethod, routePath;
    if (fileName[0] === '_') {
      routeName = parentRoute[parentRoute.length - 1];
      [routeMethod] = fileName.substr(1).split('.');
      routePath = `/${parentRoute.join('/')}/:id`;
    } else {
      [routeName, routeMethod] = fileName.split('.');
      routePath = parentRoute.length ?
        `/${parentRoute.join('/')}/${routeName}` : `/${routeName}`;
    }

    function setupRoute(route) {
      if (route instanceof Promise) {
        // Wait for the route to resolve first
        return route.then(setupRoute);
      } else if (typeof route === 'function') {
        // Simple route
        app[routeMethod](routePath, middleware.handleContentEncoding,
          middleware.buildJSONBody, route);
      } else if (route.handler) {
        // Complex route
        let handlerChain = [];
        // First set the auth handler if needed
        if (route.auth) {
          handlerChain.push(auth.authHandler);
        }
        // Handle content encoding
        handlerChain.push(middleware.handleContentEncoding);
        // Add in route defined middleware
        if (route.middleware) {
          handlerChain = [...handlerChain, ...route.middleware];
        }
        // Add our route handler at the end of the chain
        handlerChain.push(route.handler);
        // Finally set the route
        app[routeMethod](routePath, ...handlerChain);
      } else {
        logger.warn(`Uninitialized route: ${routeMethod.toUpperCase()} ` +
          `${routePath} - ${filePath}: Does not export a valid route.`);
        return resolve(null);
      }
      logger.info(`Initialized route: ${routeMethod.toUpperCase()} ` +
        `${routePath} - ${filePath}`);
      resolve({
        path: routePath,
        name: routeName,
        method: routeMethod,
        file: filePath,
        config: route
      });
    }
    try {
      // Route setup
      setupRoute(require(filePath));
    } catch (ex) {
      logger.error(`Failed to load route: ${routeMethod.toUpperCase()} ` +
        `${routePath} - ${filePath}: ${ex.stack}`);
      reject(ex);
    }
  });
}
