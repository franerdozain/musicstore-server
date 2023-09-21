const express = require('express');
const router = express.Router();
const db = require('../db');
const sessionToken = require('../session');
const path = require('path');
const fs = require('fs');

router.post('/', function (req, res, next) {
    const idUser = req.session.user.idUser;
    const {itemId} = req.body;
    console.log("HOLA", idUser, itemId)
    const addQuery = 'INSERT INTO wishlist (idProduct, idUser) VALUES (?, ?)';
    
    db.query(addQuery, [itemId, idUser], (err, result) => {
        if (err) {
            return res.status(500).send(`Query error: ${err}`);
        }
        return res.status(200).json({addOk: "The product was added to your wishlist"});
    })
})

router.get('/', function (req, res, next) {    
    const idUser = req.session.user.idUser;
    const queryGetWishlist = 'SELECT * FROM wishlist WHERE idUser = ?';   

    db.query(queryGetWishlist, [idUser], async (err, results) => {
        if (err) {
            return res.status(500).json({ errInternal: 'A server error happened :-( try again in a moment please' });
        }

        if(results.length === 0) {
            return res.status(400).json({ emptyWishlist: `There's nothing in your wishlist, time to add navigate our web :D` });
        }

        const productIds = results.map(wishlistItem => wishlistItem.idProduct).join(',');

        const queryProducts = `
            SELECT p.*, i.imageURL
            FROM product p
            JOIN images i ON p.idProduct = i.idProduct
            WHERE p.idProduct IN (${productIds});
        `;

        db.query(queryProducts, async (err, productResults) => {
            if (err) {
                return res.status(500).json({ errInternal: 'A server error happened :-( try again in a moment please' });
            }

            const uniqueProducts = {}; 

            productResults.forEach(product => {
                const { idProduct, productName, price, description, stock, brand, idSupplier, idCategory, slogan, creationDate, imageURL } = product;

                if (!uniqueProducts[idProduct]) {
                    uniqueProducts[idProduct] = { idProduct, productName, price, description, stock, brand, idSupplier, idCategory, slogan, creationDate, imageURL };
                }
            });

            const productsWithImages = Object.values(uniqueProducts);

            return res.status(200).json({ wishlist: productsWithImages });
        });
    });
});

router.delete('/:itemId', function (req, res, next) {
    const idUser = req.session.user.idUser;   
    const itemId = req.params.itemId;
    const deleteQuery = 'DELETE FROM wishlist WHERE idProduct = ? AND idUser = ?';
    
    db.query(deleteQuery, [itemId, idUser], (err, result) => {
        if (err) {
            return res.status(500).send(`Query error: ${err}`);
        }       
        return res.status(200).json({deleteOk: "Your item was deleted from your wishlist"});
    })
})

module.exports = router;