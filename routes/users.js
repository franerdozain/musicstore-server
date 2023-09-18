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
      return res.status(409).json({ noUserMsg: `The user doesn't exist` })
    }
    return res.status(200).send(result)
  })
});

router.patch('/:id', function (req, res, next) {
  const userId = req.params.id;
  let query = 'UPDATE user SET ?? = ? WHERE idUser = ?';
  const objKey = Object.keys(req.body)[0]
  const elems = [objKey, req.body[objKey], userId]

  db.query(query, elems, (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).send(`Query error: ${err}`);
    }
    if (results.affectedRows === 0) {
      return res.status(404).send('User not found :-(');
    }
    res.status(200).json({ updatedValue: req.body[objKey] });
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
