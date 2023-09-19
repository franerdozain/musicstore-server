const express = require('express');
const router = express.Router();
const categories = require('./categories');
const users = require('./users');
const auth = require('./auth');
const products = require('./products');
const cart = require('./cart');
const resetPassword = require('./resetPassword');
const checkout = require('./checkout');

router.use('/categories', categories);
router.use('/products', products);
router.use('/auth', auth);
router.use('/reset', resetPassword);
router.use('/users', users);
router.use('/cart', cart);
router.use('/checkout', checkout);

module.exports = router;
