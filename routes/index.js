const express = require('express');
const router = express.Router();
const categories = require('./categories');
const users = require('./users');
const auth = require('./auth');
const products = require('./products');
const cart = require('./cart');
const resetPassword = require('./resetPassword');
const checkout = require('./checkout');
const search = require('./search');
const wishlist = require('./wishlist');
const orders = require('./orders');
const messages = require('./messages');

router.use('/categories', categories);
router.use('/products', products);
router.use('/auth', auth);
router.use('/reset', resetPassword);
router.use('/users', users);
router.use('/cart', cart);
router.use('/checkout', checkout);
router.use('/search', search);
router.use('/wishlist', wishlist);
router.use('/orders', orders);
router.use('/messages', messages);

module.exports = router;
