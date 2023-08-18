const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', function (req, res, next) {
    const query = 'SELECT * FROM categories';

    db.query(query, (err, results) => {
        if (err) {
            console.error('3 Query Error: ', err);
            res.status(500).send('Query Error');
        } else {
            res.send(results);
        }
    });
});

router.get('/:id', function (req, res, next) {
    const categoryId = req.params.id; 
    const query = 'SELECT * FROM categories WHERE idCategory = ?';

    db.query(query, [categoryId], (err, results) => {
        if (err) {
            console.error('4 Query Error: ', err);
            res.status(500).send('Query Error');
        } else {
            if (results.length > 0) {
                const category = results[0];
                res.send(category); 
            } else {
                res.status(404).send('Category not found');
            }
        }
    });
});

router.delete('/:id', function (req, res, next) {
    const categoryIdToDelete = req.params.id; 
    const query = 'DELETE FROM categories WHERE idCategory = ?';

    db.query(query, [categoryIdToDelete], (err, results) => {
        if (err) {
            console.error('5 Query error:', err);
            res.status(500).send('Query error'); 
        } else {
            if (results.affectedRows > 0) {
                res.send('Category deleted from Database'); 
            } else {
                res.status(404).send('Category not found :-('); 
            }
        }
    });
});

router.post('/', function (req, res, next) {
    const newCategory = req.body;
    const query = 'INSERT INTO categories (categoryName, idCategoryParent) VALUES (?, ?)';
    const values = [
        newCategory.categoryName,
        newCategory.idCategoryParent
    ];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('1 Query error:', err);
            res.status(500).send('Query error');
        } else {
            res.send('New category added to the database');
        }
    });
});

router.put('/:id', function (req, res, next) {
    const categoryId = req.params.id;
    const newCategoryName = req.body.categoryName;
    const query = 'UPDATE categories SET categoryName = ? WHERE idCategory = ?';
    const values = [
        newCategoryName,
        categoryId
    ];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('2 Query error:', err);
            res.status(500).send('Query error');
        } else {
            if (results.affectedRows > 0) {
                res.send('Category name updated in the database');
            } else {
                res.status(404).send('Category not found :-(');
            }
        }
    });
});

module.exports = router;