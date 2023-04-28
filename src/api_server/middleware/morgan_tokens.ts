// /middlewares/morgan.ts
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

/*
morgan.token('response-body', (req: Request, res: Response): string => {
  const bodyval = {...JSON.parse(res.json([body]).toString())};

  // mask any input that should be secret
  if (bodyval?.data?.accessToken) {
    bodyval.data.accessToken = '*';
  }
  if (bodyval?.data?.refreshToken) {
    bodyval.data.refreshToken = '*';
  }

  return JSON.stringify(bodyval);
});
*/
export {morgan};
