const express = require('express');
const router = express.Router();
const db = require('../db');
// const sessionToken = require('../session');
const bcrypt = require('bcrypt');

router.post('/register', function (req, res, next) {
    const newUser = req.body;
    const queryCheckExistingEmail = 'SELECT email FROM user WHERE email = ?';

    db.query(queryCheckExistingEmail, [newUser.email], function (existingEmailError, existingEmailResults) {
        if (existingEmailError) {
            return res.status(500).json({ error: 'An error occurred' });
        }

        if (existingEmailResults.length > 0) {
            return res.status(409).json({ errorExistingEmail: "Email already exists" });
        }

        next(); 
    });
}, function (req, res) {
    const newUser = req.body;
    const queryAddUser = 'INSERT INTO user (username, email, country, state, city, zip, shippingAddress, passwordHash, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

    const saltRounds = 10;
    bcrypt.genSalt(saltRounds, function (saltError, salt) {
        if (saltError) {
            console.error('Error:', saltError);
            return res.status(500).json({ error: 'An error occurred' });
        }

        bcrypt.hash(newUser.password, salt, function (hashError, hash) {
            if (hashError) {
                console.error('Error:', hashError);
                return res.status(500).json({ error: 'An error occurred' });
            }

            newUser.password = hash;

            db.query(queryAddUser, [
                newUser.username,
                newUser.email,
                newUser.country,
                newUser.state,
                newUser.city,
                newUser.zip,
                newUser.shippingAddress,
                newUser.password,
                newUser.role
            ], function (insertError) {
                if (insertError) {
                    console.error('Query error:', insertError);
                    return res.status(500).send('Query error');
                }

                res.json({ message: `Welcome ${newUser.username}, your account were created successfully ` });
            });
        });
    });
});

router.post('/login', function (req, res, next) {
    const { email, password } = req.body;

    const query = 'SELECT * FROM user WHERE email = ?'

    db.query(query, [email], (error, userResult) => {
        if (error) {
            return res.status(500).json({ error: `An error occurred` });
        }

        if (userResult.length === 0) {
            return res.status(401).json({ errorInexistentEmail: `The email doesn't exist in our database, create an account by clicking "Create Account"` })
        }

        const user = userResult[0];

        bcrypt.compare(password, user.passwordHash, (error,result) => {
            if(error) {
                return res.status(401).json({ error: `An error occurred` })                
            }
            if(!result) {               
                return res.status(401).json({errorWrongPassword: `The password is incorrect`})
            }
            delete user.passwordHash
            // res.cookie('sessionId', sessionToken)            
            req.session.userId = user.idUser;
            return res.status(200).json(user)
          })
    });
});

router.get('/logout', function (req, res) {
    req.session.destroy(function () {
        req.session = null; 
        res.clearCookie('connect.sid');
        res.status(200).json({message: 'Logged out successfully'});
    });
});


module.exports = router;