const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', function (req, res) {
  const idUser = req.params.id;

  const userQuery = 'SELECT * FROM user WHERE idUser = ?'

  db.query(userQuery, [idUser], (err, result) => {
    if (err) {
      return res.status(400).json({ errMessage: 'Query Error' })
    }
    if (result.length === 0) {
      return res.status(409).json({ noUserMsg: `User not found` })
    }
    
    delete result.passwordHash
    return res.status(200).json({user: result});
  })
});

router.post('/', function (req, res) {
    const idSender = req.session.user ? req.session.user.idUser : null;
    const email = req.session.user ? null : req.body.email;
    const data = req.body;
console.log("idSender", idSender)
console.log("email", email)
console.log("data", data)
    if (!idSender && !email) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    let idReceiver;

    if (!req.session.user || (req.session.user && req.session.user.role === 'user')) {
        const queryAdminUser = 'SELECT idUser FROM user WHERE role = ?';
        const adminRole = 'admin';
console.log("entré")
        db.query(queryAdminUser, [adminRole], function (error, results) {
            if (error) {
                return res.status(500).json({ error: 'An error occurred' });
            }

            if (results.length > 0) {
                idReceiver = results[0].idUser;
            } else {
                return res.status(500).json({ error: 'Admin user not found' });
            }

            insertMessage();
        });
    } else {
        insertMessage();
    }

    function insertMessage() {
        const queryNewMsg = 'INSERT INTO messages (idSenderUser, idReceiver, subject, message, emailSender) VALUES (?, ?, ?, ?, ?)';
        const values = [idSender, idReceiver, data.subject, data.message, email];
        db.query(queryNewMsg, values, function (error, results) {
            if (error) {
                return res.status(500).json({ error: 'An error occurred' });
            }

            return res.status(201).json({ message: 'Message sent successfully' });
        });
    }
});


module.exports = router;
