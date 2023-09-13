const express = require('express');
const router = express.Router();
const db = require('../db');
// const cookie = require('cookie');
const sessionToken = require('../session');
const path = require('path');
const fs = require('fs');
const upload = require('../utils/multerConfig');

// first func: check if incoming product already exists in db (based on productName)
// second func: insert incoming product in db
// third func: insert product's specifications and/or features into their own table in db
// fourth func: save product's images into /public/images/products and insert them in db

router.post('/new', upload.array('images', 8), function (req, res, next) {
    const newProduct = req.body;
    // const images = req.files;

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
    // const images = req.files;

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
            return res.status(500).json({ errorStoringData: `There was an error storing ${newProduct.productName} product's data` });
        }

        const productId = productResults.insertId;
        req.productId = productId;

        next();
    });
}, function (req, res, next) {
    const newProduct = req.body;
    const specifications = [];
    const features = [];
    const productId = req.productId;

    for (const key in newProduct) {
        if (typeof newProduct[key] === 'string' && newProduct[key] !== 'undefined' && newProduct[key] !== '') {
            if (key.startsWith('specifications')) {
                specifications.push(newProduct[key]);
            } else if (key.startsWith('features')) {
                features.push(newProduct[key]);
            }
        }
    }

    if (specifications.length === 0 && features.length === 0) {
        return next();
    }

    const specOrFeatValues = [];

    specifications.forEach(spec => specOrFeatValues.push([productId, 'Specification', spec]));
    features.forEach(feat => specOrFeatValues.push([productId, 'Feature', feat]));

    const specQuery = 'INSERT INTO specificationsandfeatures (idProduct, specOrFeature, valueSpecOrFeature) VALUES ?';

    db.query(specQuery, [specOrFeatValues], (err, results) => {
        if (err) {
            return res.status(500).json({ errorStoringData: `There was an error storing ${newProduct.productName} product's data` });
        }

        const idSpecAndFeatures = results.insertId;
        const specAndFeaturesValues = specOrFeatValues.map(() => [productId, idSpecAndFeatures]);
        const specAndFeaturesQuery = 'INSERT INTO productspecandfeature (idProduct, idSpecAndFeatures) VALUES ?';

        db.query(specAndFeaturesQuery, [specAndFeaturesValues], (err, results) => {
            if (err) {
                return res.status(500).json({ errorStoringData: `There was an error storing ${newProduct.productName} product's data` });
            }

            next();
        });
    })
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
                return res.status(500).json({ errorStoringImg: `There was an error storing ${newProduct.productName} product's images` });
            }
        });
    }
    return res.status(201).json({ message: `The product ${productName} was added to the stock!` });
});

module.exports = router;