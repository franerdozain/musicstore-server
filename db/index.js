const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',         
    user: 'root',        
    password: 'Goku1990$MYsQl', 
    database: 'musicstore_db'      
  });

module.exports = db;