const express = require('express');
const router = express.Router();
const db = require('../db');
// const cookie = require('cookie');
const sessionToken = require('../session');
const path = require('path');
const fs = require('fs');
const upload = require('../utils/multerConfig');

router.post('/new', upload.array('images', 8), function (req, res, next) {
    const newProduct = req.body;
    const images = req.files;

    const checkProductQuery = 'SELECT * FROM product WHERE productName = ?';
    const checkProductyValues = [
        newProduct.productName,
    ];

    db.query(checkProductQuery, checkProductyValues, (err, existingProduct) => {
        if (err) {
            return res.status(500).send(`Query error: ${err}`);
        }
        if (existingProduct.length > 0) {
            return res.status(409).json({ errorExistingProduct: `The ${newProduct.productName} Product Already Exists!` });
        }

        next();
    });
}, function (req, res, next) {
    const newProduct = req.body;
    const images = req.files;

    const productQuery = 'INSERT INTO product (productName, price, description, stock, brand, idCategory, slogan) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const productValues = [
        newProduct.productName,
        newProduct.price,
        newProduct.description,
        newProduct.stock,
        newProduct.brand,
        newProduct.idCategory,
        newProduct.slogan
    ];

    db.query(productQuery, productValues, (err, productResults) => {
        if (err) {
            return res.status(500).json({errorStoringData: `There was an error storing ${newProduct.productName} product's data`});
        }

        const productId = productResults.insertId;
        req.productId = productId;
        
        next();
    });
}, function (req, res, next) {
    const newProduct = req.body;
    const specifications = [];
    const features = [];
    let specOrFeatError = false;
    const productId = req.productId;

    for (const key in newProduct) {
        if (key.startsWith('specifications')) {
            specifications.push(newProduct[key]);
        } else if (key.startsWith('features')) {
            features.push(newProduct[key]);
        }
    }

  // for the specifications storing
    for (const specOrFeat of specifications) {
        const specQuery = 'INSERT INTO specificationsandfeatures (idProduct, specOrFeature, valueSpecOrFeature) VALUES (?, ?, ?)';
        const specValues = [
            productId,
            "Specification",
            specOrFeat
        ];
    
        db.query(specQuery, specValues, (err, results) => {
            if (err) {
                return res.status(500).json({errorStoringData: `There was an error storing ${newProduct.productName} product's data`});
            }
    
            const idSpecAndFeatures = results.insertId;
    
            const specAndFeaturesQuery = 'INSERT INTO productspecandfeature (idProduct, idSpecAndFeatures) VALUES (?, ?)';
            const specAndFeaturesValues = [
                productId,
                idSpecAndFeatures
            ];
    
            db.query(specAndFeaturesQuery, specAndFeaturesValues, (err, results) => {
                if (err) {
                    return res.status(500).json({errorStoringData: `There was an error storing ${newProduct.productName} product's data`});
                }
    
            });
        });
    }

    // for the features storing (refator with specifications storing in 1)
    for (const specOrFeat of features) {
        const specQuery = 'INSERT INTO specificationsandfeatures (idProduct, specOrFeature, valueSpecOrFeature) VALUES (?, ?, ?)';
        const specValues = [
            productId,
            "Feature",
            specOrFeat
        ];
    
        db.query(specQuery, specValues, (err, results) => {
            if (err) {
                return res.status(500).json({errorStoringData: `There was an error storing ${newProduct.productName} product's data`});
            }
    
            const idSpecAndFeatures = results.insertId;
    
            const specAndFeaturesQuery = 'INSERT INTO productspecandfeature (idProduct, idSpecAndFeatures) VALUES (?, ?)';
            const specAndFeaturesValues = [
                productId,
                idSpecAndFeatures
            ];
    
            db.query(specAndFeaturesQuery, specAndFeaturesValues, (err, results) => {
                if (err) {
                    return res.status(500).json({errorStoringData: `There was an error storing ${newProduct.productName} product's data`});
                }
                next();
            });
        });
    }
}, function (req, res) {
    const images = req.files;
    const productId = req.productId;
    const productName = req.body.productName;

    for (const image of images) {
        const newImageName = image.filename;
        const destinationFolder = 'public/images/products';
        const imagePath = destinationFolder + '/' + newImageName;

        fs.renameSync(image.path, imagePath);

        const newImageQuery = 'INSERT INTO images (imageURL, idProduct) VALUES (?, ?)';
        const newImageValues = [
            newImageName,
            productId
        ];

        db.query(newImageQuery, newImageValues, (err, results) => {
            if (err) {
                return res.status(500).json({errorStoringImg: `There was an error storing ${newProduct.productName} product's images`});
            }
        });
    }
    return res.status(201).json({ message: `The product ${productName} was added to the stock!` });
});

module.exports = router;