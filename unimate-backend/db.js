// db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',      // Default XAMPP username
  password: '',      // Default XAMPP password is empty
  database: 'unimate_db',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
