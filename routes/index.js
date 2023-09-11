const express = require('express');
const router = express.Router();
const categories = require('./categories')
const users = require('./users')
const auth = require('./auth');
// const {images} = require('./images')
const resetPassword = require('./resetPassword');

router.use('/categories', categories)
// router.use('/images', images)
router.use('/auth', auth)
router.use('/reset', resetPassword)

router.use('/users', users)

module.exports = router;
