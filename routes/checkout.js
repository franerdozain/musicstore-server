const express = require('express');
const router = express.Router();
const db = require('../db');
const sessionToken = require('../session');
const path = require('path');
const fs = require('fs');

router.post('/', (req, res, next) => {
    const userId = req.session.user.idUser;
    const cartItems = req.body.cartItems;
    const dateAndTime = new Date();

    const processCartItem = (item) => {
        const { idProduct, quantity, unitPrice } = item;

        db.query('SELECT stock FROM product WHERE idProduct = ?', [idProduct], (error, results) => {
            if (error) {
                return next(error);
            }

            const stock = results[0]?.stock;

            if (stock >= quantity) {
                db.query('UPDATE product SET stock = ? WHERE idProduct = ?', [stock - quantity, idProduct], (error) => {
                    if (error) {
                        return next(error);
                    }

                    db.query('INSERT INTO orders (idUser, idProduct, quantity, unitPrice, dateAndTime) VALUES (?, ?, ?, ?, ?)', [userId, idProduct, quantity, unitPrice, dateAndTime], (error) => {
                        if (error) {
                            return next(error);
                        }

                        db.query('DELETE FROM cart WHERE idProduct = ? AND idUser = ?', [idProduct, userId], (error) => {
                            if (error) {
                                return next(error);
                            }
                        });

                            const lastItem = cartItems[cartItems.length - 1];
                            if (item === lastItem) {
                                return res.json({ success: true, message: 'Order Created! :-)' });
                            }
                        });
                    });
                } else {
                    return res.status(400).json({ message: `There's no available stock of some of your products, please check it out` });
                }
        });
    };

    cartItems.forEach(processCartItem);
});



module.exports = router;