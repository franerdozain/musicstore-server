const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/images/uploadTest")
    },
    filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, `${uniqueSuffix}-${file.originalname}`);
        }
    })
    
const upload = multer({storage: storage})

router.post('/categories/new', upload.array("images",15), function (req, res, next) {
    console.log(req.body);
})

router.get('/categories', function (req, res, next) { 
    const query = `
        SELECT i.*, c.idCategoryParent FROM images AS i
        JOIN categories AS c ON i.idCategory = c.idCategory
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Query Error: ', err);
            return res.status(500).send('Query Error');
        }
        return res.status(200).send(results); 
    });
});


router.post('/categories', function (req, res, next) {
    const { idCategory, imageURL } = req.body;

    if (!idCategory || !imageURL) {
        return res.status(400).send('Missing parameters');
    }

    const query = `
        INSERT INTO images (idCategory, imageURL) 
        VALUES (?, ?)
    `;

    db.query(query, [idCategory, imageURL], (err, results) => {
        if (err) {
            console.error('Query Error: ', err);
            return res.status(500).send('Query Error');
        }
        return res.status(200).send('Image added successfully');
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



module.exports = {images: router, upload};