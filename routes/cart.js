const express = require('express');
const router = express.Router();
const db = require('../db');
const sessionToken = require('../session');
const path = require('path');
const fs = require('fs');

router.post('/add', function (req, res, next) {
    const userColumn = req.session.user.idUser ? 'idUser' : 'idAnonymousUser';
    const {personId, idProduct, quantity} = req.body;
    const addQuery = 'INSERT INTO cart (??, idProduct, quantity) VALUES (?, ?, ?)';
    
    db.query(addQuery, [userColumn, personId, idProduct, quantity], (err, result) => {
        if (err) {
            return res.status(500).send(`Query error: ${err}`);
        }
        return res.status(200).send(result);
    })
})

module.exports = router;