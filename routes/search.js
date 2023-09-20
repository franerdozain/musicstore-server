const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', function (req, res, next) {
    const searchTerm = req.query.q;     
    const searchQuery = 'SELECT idProduct, productName FROM product WHERE productName LIKE ?';
  
    db.query(searchQuery, [`%${searchTerm}%`], (err, result) => {
      if (err) {
        return res.status(400).json({ errMessage: 'Query Error' });
      }
      return res.status(200).json(result);
    });
  });
  
  module.exports = router;
