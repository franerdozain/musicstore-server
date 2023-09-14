const express = require('express');
const router = express.Router();
const db = require('../db');
// const cookie = require('cookie');
const sessionToken = require('../session');
const path = require('path');
const fs = require('fs');

const subcategoriesImagePath = process.env.SUBCAT_IMAGE_PATH;
const categoriesImagePath = process.env.CAT_IMAGE_PATH;
const upload = require('../utils/multerConfig');

// GET categories with images
router.get('/all', function (req, res, next) { 
    const query = `
        SELECT i.*, c.idCategoryParent 
        FROM images AS i
        JOIN categories AS c ON i.idCategory = c.idCategory
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Query Error: ', err);
            return res.status(500).send('Query Error');
        }

        const categoriesQuery = 'SELECT * FROM categories';

        db.query(categoriesQuery, (err, categories) => {
            if (err) {
                console.error('Query Error: ', err);
                return res.status(500).send('Query Error');
            }

            const response = {
                images: results,
                categories: categories
            };

            return res.status(200).send(response); 
        });
    });
});

// GET categories data only
router.get('/categoriesData', function (req, res, next) {     
    const query = `
        SELECT * 
        FROM categories
    `;

    db.query(query, (err, categories) => {
        if (err) {
            console.error('Query Error: ', err);
            return res.status(500).send('Query Error');
        }

        const response = {
            categories: categories
        };
        
        return res.status(200).send(response); 
    });
});

// POST new category/subcategory
router.post('/new', upload.single('images'), function (req, res, next) {
    const newCategory = req.body;
    const image = req.file;

    const checkCategoryQuery = 'SELECT * FROM categories WHERE categoryName = ?';
    const checkCategoryValues = [
        newCategory.categoryName,       
    ];

    db.query(checkCategoryQuery, checkCategoryValues, (err, existingCategory) => {
        if (err) {
            return res.status(500).send(`Query error: ${err}`);
        }

        if (existingCategory.length > 0) {
            return res.status(409).json({errorExistingCategory: `The ${newCategory.idCategoryParent ? `${newCategory.categoryName} "Subcategory"` : `${newCategory.categoryName} "Category"`} Already Exists!`});
        }
        
        next();
    });
}, function (req, res) {  
    const newCategory = req.body;
    const image = req.file;
    const categoryQuery = 'INSERT INTO categories (categoryName, idCategoryParent) VALUES (?, ?)';
    const categoryValues = [
        newCategory.categoryName,
        newCategory.idCategoryParent
    ];

    db.query(categoryQuery, categoryValues, (err, categoryResults) => {
        if (err) {
            return res.status(500).send(`Query error: ${err}`);
        }

        const categoryId = categoryResults.insertId;
        const newImageName = image.filename;
        const destinationFolder = newCategory.idCategoryParent ? subcategoriesImagePath : categoriesImagePath;
        const imagePath = path.join(destinationFolder, newImageName);

        fs.renameSync(image.path, imagePath);

        const newImageQuery = 'INSERT INTO images (imageURL, idCategory) VALUES (?, ?)';
        const newImageValues = [
            newImageName,
            categoryId
        ];

        db.query(newImageQuery, newImageValues, (err, results) => {
            if (err) {
                return res.status(500).send(`Query error: ${err}`);
            }

            return res.status(201).json({message: `New ${newCategory.idCategoryParent ? "Subcategory" : "Category"} added to the database!`});
        });
    });
});

router.get('/:id', function (req, res, next) {
    const categoryId = req.params.id;
    const query = 'SELECT * FROM categories WHERE idCategory = ?';
    
    db.query(query, [categoryId], (err, results) => {
        if (err) {
            return res.status(500).send(`Query Error: ${err}`);
        }
        if (results.length === 0) {
            return res.status(404).send('Category not found')
        };
        const category = results[0];
        return res.send(category);
    });
});

router.delete('/:id', function (req, res, next) {
    const categoryIdToDelete = req.params.id;
    const query = 'DELETE FROM categories WHERE idCategory = ?';
    
    db.query(query, [categoryIdToDelete], (err, results) => {
        if (err) {
            console.error('Query error:', err);
            return res.status(500).send(`Query error: ${err}`);
        }
        if (results.affectedRows === 0) {
            res.status(404).send('Category not found :-(');
        }
        res.status(202).send('Category deleted from Database');
    });
});


router.patch('/:id', function (req, res, next) {
    const categoryId = req.params.id;
    let query = 'UPDATE categories SET ';
    const conditions = [];
    const values = [];
    
    if (req.body.categoryName) {
        conditions.push('categoryName = ?');
        values.push(req.body.categoryName);
    }
    
    if (req.body.idCategoryParent) {
        conditions.push('idCategoryParent = ?');
        values.push(req.body.idCategoryParent);
    }

    if (req.body.imageURL) {
        conditions.push('imageURL = ?');
        values.push(req.body.imageURL);
    }

    if (conditions.length === 0) {
        return res.status(400).send('No update fields provided');
    }
    
    query += conditions.join(', ') + ' WHERE idCategory = ?';
    values.push(categoryId);
    
    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Query error:', err);
            return res.status(500).send(`Query error: ${err}`);
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Category not found :-(');
        }
        res.status(200).send('Category updated in the database');
    });
});

router.get('/category/:id', function (req, res, next) {
    const newCategory = req.body;
    const query = '';
    const values = [
        newCategory.categoryName,
        newCategory.idCategoryParent
    ];

    db.query(query, values, (err, results) => {
        if (err) {
            return res.status(500).send(`Query error: ${err}`);
        }
        return res.status(201).send('New image added to the database :D');
    });
});



module.exports = router;