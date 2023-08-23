const mysql = require('mysql');
require('dotenv').config();
const dbPassword = process.env.DB_PASSWORD;

const db = mysql.createConnection({
    host: 'localhost',         
    user: 'root',        
    password: dbPassword, 
    database: 'musicstore_db'      
  });

module.exports = db;