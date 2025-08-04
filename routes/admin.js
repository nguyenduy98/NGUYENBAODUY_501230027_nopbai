const path = require('path');

const express = require('express');

const rootDir = require('../util/path');

const adminController = require('../controllers/admin');
const auth = require('../middleware/auth');
const couponController = require('../controllers/coupon');

const router = express.Router();

const { body } = require('express-validator');
const upload = require('../middleware/file-upload');

// Validation middleware
const validateProduct = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Vui lòng nhập tên sản phẩm')
        .isLength({ min: 3 })
        .withMessage('Tên sản phẩm phải có ít nhất 3 ký tự'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Giá sản phẩm phải lớn hơn 0'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Vui lòng nhập mô tả sản phẩm')
        .isLength({ min: 5 })
        .withMessage('Mô tả phải có ít nhất 5 ký tự')
];

// /admin/add-product => GET
router.get('/add-product', adminController.getAddProduct);

// /admin/add-product => POST
router.post('/add-product', 
    upload.single('image'),
    validateProduct,
    adminController.postAddProduct
);

// /admin/products => GET
router.get('/products', adminController.getProducts);

router.get('/edit-product/:productId', adminController.getEditProduct);

router.post('/edit-product',
    upload.single('image'),
    validateProduct,
    adminController.postEditProduct
);

router.post('/delete-product', adminController.deleteProduct);

// Đơn hàng
router.get('/orders', adminController.getOrders);
router.get('/orders/:orderId', adminController.getOrderDetails);
router.get('/orders/:orderId/edit', auth.isAdmin, adminController.getEditOrder);
router.post('/orders/:orderId/edit', auth.isAdmin, adminController.postEditOrder);
router.post('/orders/update-status', adminController.postUpdateOrderStatus);
router.post('/orders/delete', adminController.postDeleteOrder);
router.post('/orders/delete-multiple', auth.isAdmin, adminController.deleteMultipleOrders);

// API thống kê dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/weekly-revenue', adminController.getWeeklyRevenueChart);
router.get('/dashboard/bestseller-pie', adminController.getBestsellerPie);
router.get('/dashboard/order-status-stats', adminController.getOrderStatusStats);
router.get('/dashboard/top-bestseller', adminController.getTopBestseller);
router.get('/dashboard/latest-orders', adminController.getLatestOrders);
router.get('/dashboard/latest-users', adminController.getLatestUsers);
// Dashboard admin
router.get('/dashboard', adminController.getDashboard);
router.get('/users', auth.isAdmin, adminController.getUsers);
router.get('/users/:id', auth.isAdmin, adminController.getUserDetail);
router.post('/users/delete', auth.isAdmin, adminController.postDeleteUser);
router.post('/users/update-role', auth.isAdmin, adminController.postUpdateUserRole);
router.post('/users/toggle-active', auth.isAdmin, adminController.postToggleUserActive);
router.get('/profile', auth.isAdmin, adminController.getAdminProfile);

router.get('/reviews', adminController.getAllReviews);
// Đặt route xóa review có id TRƯỚC các route chặn truy cập không id
router.post('/reviews/delete/:id', adminController.deleteReview);
// Chặn truy cập trực tiếp /admin/reviews/delete/ không có id
router.get('/reviews/delete', (req, res) => res.redirect('/admin/reviews'));
router.post('/reviews/delete', (req, res) => res.redirect('/admin/reviews'));

// Routes cho chức năng reply đánh giá
router.post('/reviews/reply/add', auth.isAdmin, adminController.addAdminReply);
router.post('/reviews/reply/update', auth.isAdmin, adminController.updateAdminReply);
router.post('/reviews/reply/delete', auth.isAdmin, adminController.deleteAdminReply);

router.get('/coupons', couponController.getCoupons);
router.get('/coupons/add', couponController.getAddCoupon);
router.post('/coupons/add', couponController.postAddCoupon);
router.post('/coupons/delete/:id', couponController.deleteCoupon);
router.get('/api/coupon/:code', couponController.checkCoupon);
router.get('/api/coupons', couponController.getAvailableCoupons);
router.post('/api/coupon/use', couponController.useCoupon);

module.exports = router;

