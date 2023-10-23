const express = require('express');
const router = express.Router();
const db = require('../db');
// const cookie = require('cookie');
const sessionToken = require('../session');
const path = require('path');
const fs = require('fs');
const upload = require('../utils/multerConfig');

// store new product 
router.post('/new', upload.array('images', 8), function checkIfProductExists(req, res, next) {
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
}, function insertProductData(req, res, next) {
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
}, function insertSpecificationsAndFeatures(req, res, next) {
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

}, function handleImages(req, res) {
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
    const idUser = req.session.user?.idUser;
    const { sortBy, page, pageSize, isCategory, term } = req.query;
    const offset = (page - 1) * pageSize;
    const whereStatement = isCategory == 'true' ? 'idCategory IN (SELECT idCategory FROM categories WHERE idCategoryParent = ?)' : 'p.idCategory = ?'
    const countStatement = isCategory == 'true' ? 'IN (SELECT idCategory FROM categories WHERE idCategoryParent = ?)' : '= ?';

    if (term !== 'undefined') {
        const searchQuery = `
            SELECT p.*, 
                   (SELECT GROUP_CONCAT(imageURL) 
                    FROM images 
                    WHERE images.idProduct = p.idProduct) as imageUrls
            FROM product p
            WHERE p.productName LIKE ?`; 

        const values = [`%${term}%`]; 

        db.query(searchQuery, values, (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const productsWithImages = results.map(product => {
                return {
                    ...product,
                    imageUrls: product.imageUrls ? product.imageUrls.split(',') : []
                }
            });
            const totalCount = productsWithImages.length; 

            const totalPages = Math.ceil(totalCount / pageSize); 
            res.json({ products: productsWithImages, totalPages });
        });
    } else {
        let sqlQuery = !idUser ?
        `
    SELECT p.*, 
           (SELECT GROUP_CONCAT(imageURL) 
            FROM images 
            WHERE images.idProduct = p.idProduct) as imageUrls
    FROM product p
    WHERE ${whereStatement}` :
    `SELECT 
        p.*,
        (SELECT GROUP_CONCAT(imageURL) FROM images WHERE images.idProduct = p.idProduct) AS imageUrls,
        CASE WHEN w.idProduct IS NOT NULL THEN 1 ELSE 0 END AS isInWishlist
    FROM product p
    LEFT JOIN wishlist w ON p.idProduct = w.idProduct AND w.idUser = ?
    WHERE ${whereStatement}`;

    const sortByOptions = {
        'New': 'creationDate DESC',
        'Old': 'creationDate ASC',
        'Brand A-Z': 'brand ASC',
        'Brand Z-A': 'brand DESC',
        'Price Low to High': 'price ASC',
        'Price High to Low': 'price DESC'
    };

    const orderByClause = sortByOptions[sortBy];

    if (orderByClause) {
        sqlQuery += ` ORDER BY ${orderByClause}`;
    }

    let countQuery = `SELECT COUNT(*) as totalCount FROM product WHERE idCategory ${countStatement}`;
    const values = idUser ? [idUser, idCategory] : [idCategory];

    db.query(countQuery, values, (err, countResult) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const totalCount = countResult[0].totalCount;

        sqlQuery += ' LIMIT ? OFFSET ?';
        const values = idUser ? [idUser, idCategory, parseInt(pageSize), offset] : [idCategory, parseInt(pageSize), offset];

        db.query(sqlQuery, values, (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            const productsWithImages = results.map(product => {
                return {
                    ...product,
                    imageUrls: product.imageUrls ? product.imageUrls.split(',') : []
                }
            });

            const totalPages = Math.ceil(totalCount / pageSize);

            res.json({ products: productsWithImages, totalPages });
        });
    });   
    }
});

// get 1 product details
router.get('/details/:id', function (req, res, next) {

    const idProduct = parseInt(req.params.id);
    const productDetailsQuery = `SELECT 
    p.*,
    GROUP_CONCAT(i.imageURL) as imageUrls,
    sf.specOrFeature,
    sf.valueSpecOrFeature
FROM 
    product p
LEFT JOIN 
    images i ON p.idProduct = i.idProduct
LEFT JOIN 
    specificationsandfeatures sf ON p.idProduct = sf.idProduct
WHERE 
    p.idProduct = ?
GROUP BY 
    p.idProduct, sf.specOrFeature, sf.valueSpecOrFeature;`;

    db.query(productDetailsQuery, [idProduct], (err, results) => {
        if (err) {
            return res.status(500).json({ errorMessage: `There was an error reaching your product, try again in a moment` })
        }

        if (results.length === 0) {
            return res.status(404).json({ productNotFound: `We couldn't find your product now, please try again in a moment` })
        }

        const [productData] = results;

        const product = {
            idProduct: productData.idProduct,
            productName: productData.productName,
            price: productData.price,
            description: productData.description,
            stock: productData.stock,
            brand: productData.brand,
            slogan: productData.slogan,
            creationDate: productData.creationDate,
            imageUrls: productData.imageUrls ? productData.imageUrls.split(',') : [],
            specifications: [],
            features: []
        };

        results.forEach(result => {
            if (result.specOrFeature === 'Specification') {
                product.specifications.push(result.valueSpecOrFeature);
            } else if (result.specOrFeature === 'Feature') {
                product.features.push(result.valueSpecOrFeature);
            }
        });

        res.status(200).json({ product: product });
    })
})

router.get('/listModify/:id', function (req, res) {
    const idCategory = req.params.id;
    const queryListProducts = 'SELECT productName, idProduct FROM product WHERE idCategory = ?';

    db.query(queryListProducts, [idCategory], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        } 
       
        res.status(200).json({ products: results });
    })
})

module.exports = router;