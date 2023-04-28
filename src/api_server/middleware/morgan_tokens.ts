// From https://medium.com/geekculture/how-to-log-http-request-input-and-response-body-in-nodejs-1d5219155bf4

import {Request, Response} from 'express';
import morgan = require('morgan');

morgan.token('input', (req: Request, res: Response): string => {
  let input: Record<string, any> = {};
  if (req.method === 'GET') {
    input = req.query;
  } else {
    input = req.body;
  }
  return JSON.stringify(input);
});

export {morgan};
