import mariadb = require('mariadb');
import * as dotenv from 'dotenv';
import {resolve} from 'path';

function create_pool() {
  dotenv.config({
    path: resolve(process.cwd(), '.env.mariadb'),
  });
  if (!process.env.DB_HOST) {
    throw new Error('DB_HOST not defined');
  }
  if (!process.env.DB_USER) {
    throw new Error('DB_USER not defined');
  }
  if (!process.env.DB_PASSWORD) {
    throw new Error('DB_PASSWORD not defined');
  }
  return mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: 5,
  });
}

export const pool = create_pool();
