require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../db');
const Mailgun = require('mailgun-js');
const apiKey = process.env.MAILGUN_API_KEY; 
const domain = process.env.MAILGUN_DOMAIN; 
const mailgun = new Mailgun({ apiKey, domain });


router.get('/', function (req, res) {
    const idReceiver = req.session.user?.idUser;
    console.log("idreceiver", idReceiver)
    if (!idReceiver) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userQuery = 'SELECT * FROM messages WHERE idReceiver = ?'

    db.query(userQuery, [idReceiver], (error, result) => {
        if (error) {
            return res.status(500).json({ error: 'An error occurred' });
        }
        if (result.length === 0) {
            return res.status(409).json({ noMsg: `There's no messages` })
        }

        return res.status(200).json(result);
    })
});

router.post('/', function (req, res) {
    const idSender = req.session.user ? req.session.user.idUser : null;
    const email = req.session.user ? null : req.body.email;
    const data = req.body;
    const dateAndTime = new Date();

    if (!idSender && !email) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    let idReceiver;

    if (!req.session.user || (req.session.user && req.session.user.role === 'user')) {
        const queryAdminUser = 'SELECT idUser FROM user WHERE role = ?';
        const adminRole = 'admin';

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
        const queryNewMsg = 'INSERT INTO messages (idSenderUser, idReceiver, subject, message, emailSender, dateAndTime) VALUES (?, ?, ?, ?, ?, ?)'; 
        const values = [idSender, idReceiver, data.subject, data.message, email, dateAndTime];
        db.query(queryNewMsg, values, function (error, results) {
            if (error) {
                return res.status(500).json({ error: 'An error occurred' });
            }

            return res.status(201).json({ message: 'Message sent successfully' });
        });
    }
});


router.post('/answer', function checkAuthorized(req, res, next) {
    const idSender = req.session.user ? req.session.user.idUser : null;
   
    if (!idSender) {
        return res.status(401).json({ error: 'Unauthorized' });
    }   

    next();
    
}, function getEmail(req, res, next) {
    const { idReceiverUser } = req.body;

    if(idReceiverUser){
        const queryEmail = 'SELECT email FROM user WHERE idUser = ?'
        db.query(queryEmail, [idReceiverUser], function (error, result) {
            if (error) {
                return res.status(500).json({ error: 'An error occurred' });
            }
            req.receiverEmail = result[0].email;
            
            next();
        })
    } else {
        next();
    }
}, function insertMessage(req, res) {
    const idSender = req.session.user && req.session.user.idUser;
    const { idReceiverUser, emailReceiver, message, subject } = req.body;    
    const dateAndTime = new Date();
    const receiverColumn = idReceiverUser ? 'idReceiver' : 'emailReceiver';  
  
    const receiver = idReceiverUser || emailReceiver;

    const queryNewMsg = `INSERT INTO messages (${receiverColumn}, idSenderUser, subject, message, dateAndTime) VALUES (?, ?, ?, ?, ?)`;
    const values = [receiver, idSender, subject, message, dateAndTime];
    db.query(queryNewMsg, values, function (error, results) {
        if (error) {
            return res.status(500).json({ error: 'An error occurred' });
        }
       
        const messageToUsersEmail = {
            from: 'emailofmelodymakers@gmail.com',
            to: req.receiverEmail || emailReceiver,
            subject: subject,
            text: message
        };
    
        mailgun.messages().send(messageToUsersEmail, (error, body) => {
            if (error) {
                res.status(500).json({errorEmail: "There's was an error sending the email."});
              } else {
                return res.status(200).json({messageOk:"The response was sent by email and to the user's messages section."})
              }
        })       
    });
});


module.exports = router;
