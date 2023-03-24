import {Express, Request, Response, NextFunction} from 'express';
import * as dotenv from 'dotenv';
import express = require('express');
import {join, resolve} from 'path';
import OpenApiValidator = require('express-openapi-validator');
import morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
import packages = require('./routes/packages');
import authenticate = require('./routes/authenticate');
import reset = require('./routes/reset');
import pack = require('./routes/package');
import {pool} from './db_connector';

// Environment Setup
dotenv.config({
  path: resolve(process.cwd(), '.env.express'),
});
if (!process.env.EXPRESS_PORT) {
  throw new Error('Express Port not defined');
}
const port = process.env.EXPRESS_PORT;

// Express initialization
const app: Express = express();

// Set up logging using Morgan to stdout
app.use(morgan('dev'));

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
app.use('/packages', packages.router);
app.use('/authenticate', authenticate.router);
app.use('/reset', reset.router);
app.use('/package', pack.router);

// Basic Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err); // dump error to console for debug
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  });
});

// Start server: default to localhost
const server = app.listen(port, () => {
  async function pool_check() {
    let conn;
    try {
      console.log('Waiting connection');
      conn = await pool.getConnection();
      const databases = await conn.query('SHOW DATABASES');
      console.log(databases);
    } finally {
      if (conn) {
        conn.release(); //release to pool
        //conn.end();
      }
    }
  }

  (async () => {
    await pool_check();
  })();
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

// Closes pool on server exit
process.on('exit', async () => {
  await pool.end();
});
