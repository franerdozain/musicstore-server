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

router.get('/all', function (req, res, next) {    
    const idUser = req.session.user.idUser;
    const queryGetCart = 'SELECT * FROM cart WHERE idUser = ?';
    console.log("Received GET request at /all");

    db.query(queryGetCart, [idUser], (err, cartItems) => {
        if (err) {
            return res.status(500).json({ errInternal: 'A server error happened :-( try again in a moment please' });
        }
        if(cartItems.length === 0) {
            return res.status(400).json({ emptyCart: `There's nothing in your cart, time to add something :D` });
        }

        const productIds = cartItems.map(item => item.idProduct);
        const queryGetProducts = 'SELECT productName, price, stock, idProduct FROM product WHERE idProduct IN (?)';

        db.query(queryGetProducts, [productIds], (err, products) => {
            if (err) {
                return res.status(500).json({ errInternal: 'A server error happened :-( try again in a moment please' });
            }

            const cartWithProductDetails = cartItems.map(item => {
                const product = products.find(product => product.idProduct === item.idProduct);
                return { ...item, product };
            });

            const productImagesPromises = productIds.map(idProduct => {
                return new Promise((resolve, reject) => {
                    const imageURLQuery = `
                        SELECT imageURL
                        FROM images
                        WHERE idProduct = ?
                        LIMIT 1
                    `;
                    db.query(imageURLQuery, [idProduct], (err, result) => {
                        if (err) {
                            reject(err);
                        }
                        const imageURL = result[0] ? result[0].imageURL : null;
                        resolve({ idProduct, imageURL });
                    });
                });
            });
           
            Promise.all(productImagesPromises)
                .then(imageResults => {
                    const productImages = {};
                    imageResults.forEach(result => {
                        productImages[result.idProduct] = result.imageURL;
                    });

                    const cartWithProductAndImageDetails = cartWithProductDetails.map(item => {
                        const image = productImages[item.product.idProduct];
                        return { ...item, product: { ...item.product, image } };
                    });

                    res.status(200).json({ cart: cartWithProductAndImageDetails });
                })
                .catch(error => {
                    console.error(error);
                    res.status(500).json({ errInternal: 'A server error happened :-( try again in a moment please' });
                });
        });
    });
});


router.delete('/:id', function (req, res, next) {
    const userId = req.session.user.idUser;   
    const productId = req.params.id;
    const deleteQuery = 'DELETE FROM cart WHERE idProduct = ? AND idUser = ?';
    
    db.query(deleteQuery, [productId, userId], (err, result) => {
        if (err) {
            return res.status(500).send(`Query error: ${err}`);
        }
        if (!userId) {
            return res.status(400).json({noUser: `You must be logged in`})
        }
        return res.status(200).send(result);
    })
})

module.exports = router;