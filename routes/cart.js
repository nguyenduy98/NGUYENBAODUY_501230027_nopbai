const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart');

router.get('/cart', cartController.getCart);
router.post('/cart', cartController.postCart);
router.post('/cart-delete-item', cartController.postCartDeleteProduct);

module.exports = router; 