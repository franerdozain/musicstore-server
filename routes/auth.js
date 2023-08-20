const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/register', function (req, res, next) {
    const newUser = req.body;
    const queryCheckExistingEmail = 'SELECT email FROM user WHERE email = ?'
    const queryAddUser = 'INSERT INTO user (username, email, country, state, city, zip, shippingAddress, passwordHash, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [
        newUser.username,
        newUser.email,
        newUser.country,
        newUser.state,
        newUser.city,
        newUser.zip,
        newUser.shippingAddress,
        newUser.passwordHash,
        newUser.role
    ];

    db.query(queryCheckExistingEmail, [newUser.email], (err, existingEmailResults) => {
        if (err) {
            console.error('Query error:', err);
            return res.status(500).send('Query error');
        }

        if (existingEmailResults.length > 0) {
            return res.status(400).send({ error: "Email already exists" });
        }

        db.query(queryAddUser, values, (err, results) => {
            if (err) {
                console.error('Query error:', err);
                return res.status(500).send('Query error');
            }

            res.send({ "Message": "New user registered successfully" });
        });
    });
});

router.post('/login', function (req, res, next) {
    const { email, passwordHash } = req.body;

    const query = 'SELECT * FROM user WHERE email = ?'

    db.query(query, [email], (error, userResult) => {
        if (error) {
            return res.status(500).json({ error: `An error occurred` });
        }

        if (userResult.length === 0) {
            return res.status(401).json({ error: `The email doesn't exist in our database, create an account by clicking "Create Account"` })
        }

        const user = userResult[0];
        if (passwordHash !== user.passwordHash) {
            return res.status(401).json({ error: `The password is incorrect.` })
        }

        return res.status(200).json({ msg: `Access granted` })
    });
})



module.exports = router;