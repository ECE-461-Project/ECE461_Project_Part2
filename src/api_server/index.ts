import {Express, Request, Response} from 'express';
import * as dotenv from 'dotenv';
import express = require('express');
import {resolve} from 'path';

dotenv.config({
  path: resolve(process.cwd(), '.env.express'),
});

const app: Express = express();
if (!process.env.EXPRESS_PORT) {
  throw new Error('Express Port not defined');
}
const port = process.env.EXPRESS_PORT;

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server. An update');
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
