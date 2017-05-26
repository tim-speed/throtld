/**
 * This file contains express.js middleware, and helpers for writing middleware
 */
const zlib = require('zlib');
const session = require('express-session');
const crypto = require('crypto');
const logger = require('./logger')('middleware');

const middleware = module.exports = {
  /**
   * Simple helper to read the inbound data stream from the request
   */
  readToBuffer(req) {
    return new Promise((resolve, reject) => {
      if (req._buffer) {
        return reject('request has already been read.');
      }
      // Lets figure out the content encoding
      // https://developer.mozilla.org
      //   .../en-US/docs/Web/HTTP/Headers/Content-Encoding
      const contentEncoding = (req.headers['content-encoding'] || 'identity')
        .toLowerCase();
      const contentLength = Number(req.headers['content-length']);

      // Time to handle it
      let stream;
      switch (contentEncoding) {
        case 'br':
          // TODO: https://www.npmjs.com/package/shrink-ray
          return reject('Sorry the brotli Content-Encoding, is not ' +
            'currently supported, please use deflate or gzip.');
        case 'compress':
          return reject('Outdated Content-Encoding: compress.\r\n' +
            'No one uses this anymore, so please stop.');
        case 'deflate':
          stream = zlib.createInflate();
          req.pipe(stream);
          break;
        case 'gzip':
        case 'x-gzip':
          stream = zlib.createGunzip();
          req.pipe(stream);
          break;
        case 'identity':
          stream = req;
          break;
        default:
          return reject(`Invalid Content-Encoding: ${contentEncoding}`);
      }

      // Time to read it
      let buffer = new Buffer.alloc(0);
      let resolved = false;
      function resolveOnce() {
        if (!resolved) {
          resolved = true;
          if (contentLength && buffer.length !== contentLength) {
            return reject(`Received ${buffer.length} bytes, but expected ` +
              `${contentLength} as defined in the Content-Length header.`);
          }
          // Return the buffer and store it on the request
          req._buffer = buffer;
          resolve(buffer);
        }
      }
      // Read till contentLength or end
      stream.on('data', (data) => {
        buffer = Buffer.concat([buffer, data]);
        if (contentLength && buffer.length === contentLength) {
          resolveOnce();
        }
      });
      stream.on('end', resolveOnce);
    });
  },

  /**
   * Middleware that handles content encoding and provides req._buffer
   */
  handleContentEncoding(req, res, next) {
    middleware.readToBuffer(req).then(buffer => {
      // pass on to the next middleware
      next();
    }, reason => {
      logger.error(`Failed to read encoded body: ${reason}`);
      res.status(500).send(reason);
    });
  },

  /**
   * Middleware that builds JSON req.body from req._buffer
   */
  buildJSONBody(req, res, next) {
    if (!req._buffer.length) {
      req.body = null;
      return next();
    }
    try {
      const body = req._buffer.toString('utf8');
      req.body = JSON.parse(body);
      next();
    } catch(ex) {
      logger.error(`Failed to process body as JSON: ${ex}`);
      res.status(422).send('Message body is invalid JSON');
    }
  },

  /**
   * Middleware that validates a JSON object, and returns a message based on a
   *  provided template.
   */
  checkJSON(idealJSON, errCode = 400) {
    function recursiveValidate(ideal, actual) {
      for (const key in ideal) {
        const validator = ideal[key];
        const target = actual[key];
        let message;
        if (typeof validator === 'function') {
          // Check validator
          logger.trace(`JSON Validator checking ${key}: ${target}`);
          message = validator(target);
        } else {
          // Assume object
          message = recursiveValidate(validator, target);
        }
        if (typeof message === 'string') {
          // Validation failed, abort
          return message;
        }
      }
    }
    return function handleCheckJSON(req, res, next) {
      const json = req.body;
      const message = recursiveValidate(idealJSON, json);
      if (typeof message === 'string') {
        // Failed validation, send error
        return res.status(errCode).send({ message });
      }
      next();
    };
  },

  /**
   * Middleware that validates request params
   */
  checkParams(idealParams, errCode = 400) {
    return function handleCheckJSON(req, res, next) {
      let message;
      for (const key in idealParams) {
        message = idealParams[key](req.params[key]);
        if (typeof message === 'string') {
          // Failed validation, send error
          return res.status(errCode).send({ message });
        }
      }
      next();
    };
  },

  /**
   * Simple session middleware using express-session
   */
  provideSession: session({
    secret: crypto.randomBytes(64).toString('base64'),
    resave: false,
    saveUninitialized: true
  })
};
