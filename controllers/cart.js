const Cart = require('../models/cart');
const Product = require('../models/product');

exports.getCart = async (req, res, next) => {
    try {
        const cart = await Cart.getCart();
        res.render('cart', {
            products: cart.products,
            totalPrice: cart.totalPrice,
            pageTitle: 'Giỏ hàng',
            path: '/cart'
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
            pageTitle: 'Lỗi',
            path: '/error',
            error: 'Có lỗi xảy ra khi lấy thông tin giỏ hàng'
        });
    }
};

exports.postCart = async (req, res, next) => {
    try {
        const prodId = req.body.productId;
        await Cart.addProduct(prodId);
        res.redirect('/cart');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
            pageTitle: 'Lỗi',
            path: '/error',
            error: 'Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng'
        });
    }
};

exports.postCartDeleteProduct = async (req, res, next) => {
    try {
        const prodId = req.body.productId;
        await Cart.deleteProduct(prodId);
        res.redirect('/cart');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
            pageTitle: 'Lỗi',
            path: '/error',
            error: 'Có lỗi xảy ra khi xóa sản phẩm khỏi giỏ hàng'
        });
    }
}; 