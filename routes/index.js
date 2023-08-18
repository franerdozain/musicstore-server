const express = require('express');
const router = express.Router();
const categories = require('./categories')
const users = require('./users')

router.use('/categories', categories)
router.use('/users', users)

module.exports = router;
