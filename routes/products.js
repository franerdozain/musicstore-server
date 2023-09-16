const express = require('express');
const router = express.Router();
const db = require('../db');
// const cookie = require('cookie');
const sessionToken = require('../session');
const path = require('path');
const fs = require('fs');
const upload = require('../utils/multerConfig');

// store new product in db
router.post('/new', upload.array('images', 8), function checkIfProductExists (req, res, next) {
    const newProduct = req.body;

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
}, function insertProductData (req, res, next) {
    const newProduct = req.body;

    const productQuery = 'INSERT INTO product (productName, price, description, stock, brand, idCategory, slogan, creationDate) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())';
    const productValues = [
        newProduct.productName,
        newProduct.price,
        newProduct.description,
        newProduct.stock,
        newProduct.brand,
        newProduct.idCategory,
        newProduct.slogan,
        null
    ];

    db.query(productQuery, productValues, (err, productResults) => {
        if (err) {
            return res.status(500).json({ errorStoringData: `There was an error storing ${newProduct.productName} product's data` });
        }

        const productId = productResults.insertId;
        req.productId = productId;

        next();
    });
}, function insertSpecificationsAndFeatures (req, res, next) {
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

        // obtain the first insertion and increment by 1 each id (without this every spec/feat gets the same id)
        const insertedIds = results.insertId;
        specOrFeatValues.forEach((row, index) => {
            row[1] = insertedIds + index;
        });

        const specAndFeaturesValues = specOrFeatValues.map(([productId, idSpecAndFeatures]) => [productId, idSpecAndFeatures]);
        const specAndFeaturesQuery = 'INSERT INTO productspecandfeature (idProduct, idSpecAndFeatures) VALUES ?';

        db.query(specAndFeaturesQuery, [specAndFeaturesValues], (err, results) => {
            if (err) {
                return res.status(500).json({ errorStoringData: `There was an error storing ${newProduct.productName} product's data` });
            }

            next();
        });
    });

}, function handleImages (req, res) {
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
                return res.status(500).json({ errorStoringImg: `There was an error storing ${productName} product's images` });
            }
        });
    }
    return res.status(201).json({ message: `The product ${productName} was added to the stock!` });
});

// get n products with/without sortBy 
router.get('/list/:id', function (req, res, next) {
    const idCategory = req.params.id; 
    const { limit, sortBy } = req.query;

    // let sqlQuery = 'SELECT * FROM product WHERE idCategory = ?';
    let sqlQuery = `
    SELECT p.*, 
           (SELECT GROUP_CONCAT(imageURL) 
            FROM images 
            WHERE images.idProduct = p.idProduct) as imageUrls
    FROM product p
    WHERE p.idCategory = ?`;

    switch (sortBy) {
        case 'new':
            sqlQuery += ' ORDER BY creationDate DESC'; 
            break;
        case 'old':
            sqlQuery += ' ORDER BY creationDate ASC'; 
            break;
        case 'brand_az':
            sqlQuery += ' ORDER BY brand ASC'; 
            break;
        case 'brand_za':
            sqlQuery += ' ORDER BY brand DESC'; 
            break;
        case 'price_asc':
            sqlQuery += ' ORDER BY price ASC'; 
            break;
        case 'price_desc':
            sqlQuery += ' ORDER BY price DESC'; 
            break;
    }

    if (limit) {
        sqlQuery += ` LIMIT ${parseInt(limit)}`;
    }
    
    db.query(sqlQuery, [idCategory], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const productsWithImages = results.map(product => {
       
            return {
                ...product,
                imageUrls: product.imageUrls ? product.imageUrls.split(',') : [] 
            }
        });
        res.json({ products: productsWithImages });
    });
})

// get n products of all subcategories from a parent category, with/without sortBy 
router.get('/list/allSubcategories', function (req, res, next) {
    const idCategory = req.body.idCategory;
    const { limit, sortBy } = req.query; 

    let sqlQuery = `
        SELECT * 
        FROM product 
        WHERE idCategory IN (SELECT idCategory FROM categories WHERE idCategoryParent = ?)
    `;

    switch (sortBy) {
        case 'new':
            sqlQuery += ' ORDER BY creationDate DESC'; 
            break;
        case 'old':
            sqlQuery += ' ORDER BY creationDate ASC'; 
            break;
        case 'brand_az':
            sqlQuery += ' ORDER BY brand ASC'; 
            break;
        case 'brand_za':
            sqlQuery += ' ORDER BY brand DESC'; 
            break;
        case 'price_asc':
            sqlQuery += ' ORDER BY price ASC'; 
            break;
        case 'price_desc':
            sqlQuery += ' ORDER BY price DESC'; 
            break;
    }

    if (limit) {
        sqlQuery += ` LIMIT ${parseInt(limit)}`;
    }

    db.query(sqlQuery, [idCategory], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ products: results });
    });
});

module.exports = router;