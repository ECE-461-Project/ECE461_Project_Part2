import {Express, Request, Response, NextFunction} from 'express';
import * as dotenv from 'dotenv';
import express = require('express');
import {join, resolve} from 'path';
import OpenApiValidator = require('express-openapi-validator');
import morgan = require('morgan');
import packages = require('./routes/packages');

// Environment Setup
dotenv.config({
  path: resolve(process.cwd(), '.env.express'),
});
if (!process.env.EXPRESS_PORT) {
  throw new Error('Express Port not defined');
}
if (!process.env.EXPRESS_API_SPEC) {
  throw new Error('Express API Spec file not defined');
}
const port = process.env.EXPRESS_PORT;

// Express initialization
const app: Express = express();

// Set up logging using Morgan to stdout
app.use(morgan('dev'));

// Set up body parsers middleware
app.use(express.json());

// Show spec: not required, for testing purposes
const spec = join(process.cwd(), process.env.EXPRESS_API_SPEC);
app.use('/spec', express.static(spec));

// Set up OpenApiValidator middleware
app.use(
  OpenApiValidator.middleware({
    apiSpec: spec,
    validateResponses: true,
  })
);

// Routing setup
app.use('/packages', packages.router);

// Basic Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // 7. Customize errors
  console.error(err); // dump error to console for debug
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  });
});

// Start server: default to localhost
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
