const mysql = require('mysql');
require('dotenv').config();
const password = process.env.DB_PASSWORD;
const host = process.env.HOST;
const user = process.env.USER;
const database = process.env.DATABASE;

const db = mysql.createConnection({
    host,         
    user,        
    password, 
    database,     
  });

module.exports = db;