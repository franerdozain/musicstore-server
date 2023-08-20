const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', function (req, res, next) {
    const query = 'SELECT * FROM categories';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Query Error: ', err);
            return res.status(500).send('Query Error');
        }
        return res.status(200).send(results);
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

router.post('/', function (req, res, next) {
    const newCategory = req.body;
    const query = 'INSERT INTO categories (categoryName, idCategoryParent) VALUES (?, ?)';
    const values = [
        newCategory.categoryName,
        newCategory.idCategoryParent
    ];

    db.query(query, values, (err, results) => {
        if (err) {
            return res.status(500).send(`Query error: ${err}`);
        }
        return res.status(201).send('New category added to the database :D');
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



module.exports = router;