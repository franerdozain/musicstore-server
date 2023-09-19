const express = require('express');
const router = express.Router();
const db = require('../db');

// 
router.get('/all', function (req, res, next) {
  const usersQuery = 'SELECT * FROM user'

  db.query(usersQuery, (err, result) => {
    if (err) {
      return res.status(400).json({ errMessage: 'Query Error' })
    }
    return res.status(200).send(result)
  })
});

router.get('/:id', function (req, res, next) {
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

router.patch('/:id', function (req, res, next) {  
  const userId = req.params.id;
  const fieldsToUpdate = req.body;

  if (!fieldsToUpdate || Object.keys(fieldsToUpdate).length === 0) {
    return res.status(400).json({noFields: 'No fields to update'});
  }

  const updatedValues = {};

  const promises = Object.keys(fieldsToUpdate).map(field => {
    const query = 'UPDATE user SET ?? = ? WHERE idUser = ?';
    const elems = [field, fieldsToUpdate[field], userId];

    return new Promise((resolve, reject) => {
      db.query(query, elems, (err, results) => {
        if (err) {          
          reject(err);
        } else if (results.affectedRows === 0) {
          reject(new Error('User not found :-('));
        } else {
          updatedValues[field] = fieldsToUpdate[field];
          resolve();
        }
      });
    });
  });

  Promise.all(promises)
    .then(() => {
      res.status(200).json({ updatedValues });
    })
    .catch(error => {
      res.status(500).send(`Error: ${error.message}`);
    });
});


router.delete('/:id', function (req, res, next) {
  const userId = req.params.id;

  const deleteUserQuery = 'DELETE FROM user WHERE idUser = ?'

  db.query(deleteUserQuery, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ errorMsg: `An error ocurred, try again in a moment please` })
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('User not found :-(');
    }
    res.status(200).json({ message: `User deleted` })

  })
});

module.exports = router;
