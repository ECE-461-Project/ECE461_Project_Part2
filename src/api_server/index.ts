import {Express, Request, Response, NextFunction} from 'express';
import * as dotenv from 'dotenv';
import express = require('express');
import {join, resolve} from 'path';
import OpenApiValidator = require('express-openapi-validator');
import morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
import sizecost = require('./routes/sizecost');
import packages = require('./routes/packages');
import authenticate = require('./routes/authenticate');
import reset = require('./routes/reset');
import pack = require('./routes/package');
import {create_logger} from '../logging_setup';
import {verifyToken} from './middleware/authorize';
import {sequelize, users} from './db_connector';
import user_router = require('./routes/users');

// Environment Setup
dotenv.config({
  path: resolve(process.cwd(), '.env.express'),
});
if (!process.env.EXPRESS_PORT) {
  throw new Error('Express Port not defined');
}
try {
  dotenv.config({
    path: resolve(process.cwd(), '.env'),
  });
} catch (err) {
  console.log('.env file not found');
}
if (!process.env.GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN not defined');
}
const port = process.env.EXPRESS_PORT;

// Express initialization
const app: Express = express();

// Set up logging using Morgan to stdout
if (process.env.PRODUCTION) {
  app.use(
    morgan((tokens, req, res) => {
      return JSON.stringify({
        severity: 'DEBUG',
        message: {
          method: tokens['method'](req, res),
          url: tokens['url'](req, res),
          status: tokens['status'](req, res),
          response_time: tokens['response-time'](req, res),
          content_length: tokens['res'](req, res, 'content-length'),
        },
      });
    })
  );
} else {
  app.use(morgan('dev'));
}

// set up part 1 logging
create_logger();

// Set up body parsers middleware
app.use(express.json());

// Show spec: not required, for testing purposes
const spec = join(process.cwd(), 'src', 'api_server', 'api', 'p2spec.yaml');
const swaggerDocument = YAML.load(spec);
//app.use('/spec', express.static(spec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Set up OpenApiValidator middleware
app.use(
  OpenApiValidator.middleware({
    apiSpec: spec,
    validateResponses: true,
    validateRequests: true,
  })
);

// Routing setup
app.use('/packages', [verifyToken, packages.router]);
app.use('/authenticate', authenticate.router);
app.use('/reset', [verifyToken, reset.router]);
app.use('/package', [verifyToken, pack.router]);
app.use('/sizecost', [verifyToken, sizecost.router]);
app.use('/user', [verifyToken, user_router.router]);


// Basic Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  globalThis.logger?.error(`Error handler called: ${err}`); // dump error to console for debug
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  });
});

async function main() {
  // Sync databases by using alter (does not drop)
  try {
    await sequelize.sync({alter: true});
    globalThis.logger?.info('INITIAL Database tables have been synced');
  } catch (err) {
    globalThis.logger?.error(err);
    globalThis.logger?.error('INITIAL Database table sync failed');
  }
  // Create default user
  try {
    const [default_user, created] = await users.findOrCreate({
      where: {Username: 'ece30861defaultadminuser'},
      defaults: {
        UserPassword:
          // They changed password so it uses ' and " instead of their UTF-8 versions
          'correcthorsebatterystaple123(!__+@**(A\'"`;DROP TABLE packages;',
        Permissions: {isAdmin: true},
        UserGroups: {},
      },
    });
    if (created) {
      globalThis.logger?.info('default_user created');
    } else {
      globalThis.logger?.info('default_user already exists');
    }
  } catch (err) {
    globalThis.logger?.error(err);
    globalThis.logger?.error('Creation of default user failed');
  }
  // Start server
  const server = app.listen(port, () => {
    globalThis.logger?.info(
      `⚡️[server]: Server is running at http://localhost:${port}`
    );
  });
  return server;
}

const server = main();

process.on('SIGTERM', () => {
  globalThis.logger?.info('received SIGTERM, exiting gracefully');
  // sequelize is closed on process exit
  // server should close as well on process exit
  // eslint-disable-next-line no-process-exit
  process.exit(0);
});
