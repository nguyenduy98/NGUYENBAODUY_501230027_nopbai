const path = require('path');

const express = require('express');

const rootDir = require('../util/path');

const products = require('./admin').products;

const shopController = require('../controllers/shop');
const cartController = require('../controllers/cart');
const auth = require('../middleware/auth');
const isAuthenticated = require('../middleware/auth');

const router = express.Router();

// Trang chủ
router.get('/', shopController.getIndex);

// Trang danh sách sản phẩm
router.get('/products', shopController.getProducts);

// Trang chi tiết sản phẩm
router.get('/products/:productId', shopController.getProduct);

// Trang danh sách sản phẩm theo nhóm Trái cây Việt Nam
router.get('/collections/trai-cay-viet-nam', shopController.getVietnamCollection);

// Trang danh sách sản phẩm theo nhóm Quà tặng trái cây
router.get('/collections/qua-tang-trai-cay', shopController.getGiftCollection);
// Trang danh sách sản phẩm theo nhóm Trái cây nhập khẩu
router.get('/collections/trai-cay-nhap-khau', shopController.getImportCollection);

// Trang giỏ hàng
router.get('/cart', shopController.getCart);
router.post('/cart', shopController.postCart);
router.post('/cart-delete-item', shopController.postCartDeleteProduct);
router.post('/update-quantity', shopController.postUpdateQuantity);

// Trang thanh toán
router.get('/checkout', auth.isAuthenticated, shopController.getCheckout);
router.post('/', auth.isAuthenticated, shopController.postPlaceOrder);

// Trang đơn hàng
router.get('/orders', shopController.getOrders);
router.get('/orders/:orderId', shopController.getOrderDetails);
router.get('/orders/:orderId/invoice', shopController.getInvoice);
router.post('/orders/:orderId/update-status', shopController.postUpdateOrderStatus);
router.post('/orders/:orderId/cancel', isAuthenticated.isAuthenticated, shopController.cancelOrder);
router.post('/orders/:orderId/cancel-request', isAuthenticated.isAuthenticated, shopController.cancelCancelRequest);

// Trang xác nhận đặt hàng thành công
router.get('/order-success', shopController.getOrderSuccess);

// Đăng nhập
router.get('/login', shopController.getLogin);
router.post('/login', shopController.postLogin);

// Đăng ký
router.get('/register', shopController.getRegister);
router.post('/register', shopController.postRegister);

// Trang profile (chỉ cho user đã đăng nhập)
router.get('/profile', auth.isAuth, shopController.getProfile);
router.post('/profile/update-info', auth.isAuth, shopController.postUpdateInfo);
router.post('/profile/update-email', auth.isAuth, shopController.postUpdateEmail);
router.post('/profile/update-password', auth.isAuth, shopController.postUpdatePassword);
router.post('/profile/check-password', auth.isAuth, async (req, res) => {
  const { oldPassword } = req.body;
  const user = await require('../models/user').findById(req.session.user._id);
  if (!user) return res.json({ valid: false });
  const bcrypt = require('bcryptjs');
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  res.json({ valid: isMatch });
});
router.post('/logout', shopController.postLogout);

router.post('/reviews', isAuthenticated.isAuthenticated, shopController.postReview);
router.get('/reviews/api', shopController.getReviewApi);

// API autocomplete sản phẩm nâng cấp
router.get('/api/products/autocomplete', async (req, res) => {
  const q = req.query.q || '';
  if (!q) return res.json({ products: [], total: 0 });
  const all = await require('../models/product').find({ title: { $regex: q, $options: 'i' } });
  const products = all.slice(0, 5).map(p => ({
    _id: p._id,
    title: p.title,
    imgUrl: p.imgUrl,
    price: p.price
  }));
  res.json({ products, total: all.length });
});

module.exports = router;
