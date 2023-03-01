import mariadb = require('mariadb');

// Define environment variables
// Uses default port of 3306
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'secret_password';

// Can also use .env file to define the environment variables above
import * as dotenv from 'dotenv';
dotenv.config();

// This creates a pool. Multiple connections can be made at once to do batch processing
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionLimit: 5,
});

// This is a sample async function that creates a connection, does some stuff, and closes the connection
async function asyncFunction() {
  let conn;
  try {
    console.log('Waiting connection');
    conn = await pool.getConnection();
    const databases = await conn.query('SHOW DATABASES');
    console.log(databases);
    await conn.query('USE test2');
    const rows = await conn.query('SELECT * FROM test2_table');
    console.log(rows);
    // rows: [ {val: 1}, meta: ... ]
  } finally {
    if (conn) {
      conn.release(); //release to pool
      //conn.end();
    }
  }
}

(async () => {
  await asyncFunction();
  // Ensure that the pool is closed!!
  pool.end();
})();
