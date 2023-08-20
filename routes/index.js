const express = require('express');
const router = express.Router();
const categories = require('./categories')
const users = require('./users')
const auth = require('./auth')

router.use('/categories', categories)
router.use('/auth', auth)

router.use('/users', users)

module.exports = router;
