const express = require('express');
const router = express.Router();
const categories = require('./categories')
const users = require('./users')
const auth = require('./auth');
const products = require('./products')
const cart = require('./cart');
const resetPassword = require('./resetPassword');

router.use('/categories', categories)
router.use('/products', products)
router.use('/auth', auth)
router.use('/reset', resetPassword)
router.use('/users', users)
router.use('/cart', cart)

module.exports = router;
