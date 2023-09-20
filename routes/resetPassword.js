require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../db');
const Mailgun = require('mailgun-js');
const apiKey = process.env.MAILGUN_API_KEY; 
const domain = 'sandboxeff597fa47714e8da2bf76b6fcee4028.mailgun.org'; 
const mailgun = new Mailgun({ apiKey, domain });
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;
const bcrypt = require('bcrypt');

router.post('/', function (req, res, next) {
    const email = req.body.email;    
    const queryEmail = 'SELECT * FROM user WHERE email = ?'
    db.query(queryEmail, [email], async (error, userResult) => {
        if(error) {
            return res.status(500).json({error: `An error occurred`});
        }
        
        if (userResult.length === 0) {
            return res.status(401).json({notFound: `We can't find your email, please check for any typos or create an account by clicking "Create Account"` })
        }
        
        const user = userResult[0];
        const resetToken = jwt.sign({ email: user.email }, secretKey, { expiresIn: '1h' });
        const resetLink = `http://localhost:3000/reset/new-password?token=${resetToken}`;

        const message = {
            from: 'emailofmelodymakers@gmail.com',
            to: user.email,
            subject: 'Reset Your Musicstore Account Password',
            html: `
              <p>Hi, ${user.username}</p>
              <p>Click the following link to change your password:</p>
              <a href="${resetLink}">Reset Password</a>
              <p>It will expire in 1 hour</p>
            `
          };
          
          mailgun.messages().send(message, (error, body) => {
            if (error) {
              console.error('Error sending email:', error);
            } else {
               return res.status(200).json({message: "An email was sent to you with a link to reset your password. The link will expire in 1 hour."})
            }
          }); 
    })
})

router.patch('/new-password', function (req, res, next) {
  const {token, password} = req.body;
  const queryNewPassword = 'UPDATE user SET passwordHash = ? WHERE email = ?'
  
  try {
    const decodedToken = jwt.verify(token, secretKey);
    const userEmail = decodedToken.email;
    const saltRounds = 10;
    
   bcrypt.genSalt(saltRounds, (error, salt) => {
    if (error) {      
      return res.status(500).json({ error: 'An error occurred' });
    }

    bcrypt.hash(password, salt, (error, hash) => {
      if (error) {       
        return res.status(500).json({ error: 'An error occurred' });
      }
      
      db.query(queryNewPassword, [hash, userEmail], async (error, updatePasswordResult) => {
        if (error) {
          return res.status(500).json({error: `An error occurred`});
        }
        res.status(200).json({ message: 'Password updated successfully' });
      })   
    })
   })
   
  } catch (error) {
    console.error('Error decoding token:', error.message);
    return res.status(498).json({error: 'Token Expired: Request New Reset Password Link'})
  }
})

module.exports = router;