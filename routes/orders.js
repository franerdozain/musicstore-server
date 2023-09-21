const express = require('express');
const router = express.Router();
const db = require('../db');
const sessionToken = require('../session');
const path = require('path');
const fs = require('fs');

router.get('/', function (req, res, next) {
    const idUser = req.session.user.idUser;
    const queryGetOrders = 'SELECT o.*, p.productName FROM orders o JOIN product p ON o.idProduct = p.idProduct WHERE o.idUser = ?';

    db.query(queryGetOrders, [idUser], (err, results) => {
        if (err) {
            return res.status(500).json({ errInternal: 'A server error happened :-( try again in a moment please' });
        }

        if (results.length === 0) {
            return res.status(400).json({ emptyWishlist: `No orders yet` });
        }

        return res.status(200).json({ orders: results });
    });
});

module.exports = router;