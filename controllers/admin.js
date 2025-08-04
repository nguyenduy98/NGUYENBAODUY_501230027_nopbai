const Product = require('../models/product');
const { validationResult } = require('express-validator');
const Order = require('../models/order');
const User = require('../models/user');
const dateFormat = require('dateformat');
const Review = require('../models/review');

exports.getAddProduct = (req, res, next) => {
    res.render('admin-edit-product', {
        pageTitle: 'Thêm sản phẩm',
        path: '/admin/add-product',
        editing: false,
        hasError: false,
        product: {
            title: '',
            price: '',
            description: '',
            imgUrl: ''
        },
        validationErrors: [],
        errorMessage: null
    });
};

exports.postAddProduct = async (req, res, next) => {
    const title = req.body.title;
    const price = req.body.price;
    const description = req.body.description;
    const image = req.file;
    const banner = req.body.banner;
    const isKg = !!req.body.isKg;
    const stock = parseInt(req.body.stock) || 0;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin-edit-product', {
            pageTitle: 'Thêm sản phẩm',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            validationErrors: errors.array(),
            errorMessage: errors.array()[0].msg
        });
    }

    if (!image) {
        return res.status(422).render('admin-edit-product', {
            pageTitle: 'Thêm sản phẩm',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            validationErrors: [{ param: 'image', msg: 'Vui lòng chọn hình ảnh sản phẩm' }],
            errorMessage: 'Vui lòng chọn hình ảnh sản phẩm'
        });
    }

    try {
        const product = new Product({
            title: title,
            price: price,
            description: description,
            imgUrl: '/images/products/' + image.filename,
            banner: banner,
            isKg: isKg,
            stock: stock
        });

        await product.save();
        res.redirect('/admin/products');
    } catch (err) {
        next(err);
    }
};

exports.getProducts = async (req, res, next) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        // Map giá trị banner sang tên nhóm dễ hiểu
        const groupMap = {
            vietnam: 'Trái cây Việt Nam',
            import: 'Trái cây nhập khẩu',
            gift: 'Quà tặng'
        };
        const productsWithGroup = products.map(p => ({
            ...p._doc,
            groupName: groupMap[p.banner] || ''
        }));
        res.render('admin-products', {
            prods: productsWithGroup,
            pageTitle: 'Quản lý sản phẩm',
            path: '/admin/products'
        });
    } catch (err) {
        next(err);
    }
};

exports.getEditProduct = async (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    try {
        const product = await Product.findById(prodId);
        if (!product) {
            return res.redirect('/');
        }
        res.render('admin-edit-product', {
            pageTitle: 'Chỉnh sửa sản phẩm',
            path: '/admin/edit-product',
            editing: editMode,
            product: product,
            hasError: false,
            validationErrors: [],
            errorMessage: null
        });
    } catch (err) {
        next(err);
    }
};

exports.postEditProduct = async (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;
    const image = req.file;
    const banner = req.body.banner;
    const isKg = !!req.body.isKg;
    const stock = parseInt(req.body.stock) || 0;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin-edit-product', {
            pageTitle: 'Chỉnh sửa sản phẩm',
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDescription,
                _id: prodId
            },
            validationErrors: errors.array(),
            errorMessage: errors.array()[0].msg
        });
    }

    try {
        const product = await Product.findById(prodId);
        if (!product) {
            return res.redirect('/');
        }

        product.title = updatedTitle;
        product.price = updatedPrice;
        product.description = updatedDescription;
        product.banner = banner;
        product.isKg = isKg;
        product.stock = stock;
        if (image) {
            product.imgUrl = '/images/products/' + image.filename;
        }

        await product.save();
        res.redirect('/admin/products');
    } catch (err) {
        next(err);
    }
};

exports.deleteProduct = async (req, res, next) => {
    const prodId = req.body.productId;
    try {
        await Product.findByIdAndDelete(prodId);
        res.redirect('/admin/products');
    } catch (err) {
        next(err);
    }
};

// Quản lý đơn hàng cho admin
exports.getOrders = async (req, res, next) => {
    try {
        const orders = await Order.getOrders();
        res.render('orders', {
            orders: orders,
            pageTitle: 'Quản lý đơn hàng',
            path: '/admin/orders',
            formatDate: (date) => {
                const d = new Date(date);
                return d.toLocaleString('vi-VN', { hour12: false });
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.getOrderDetails = async (req, res, next) => {
    const orderId = req.params.orderId;
    try {
        const order = await Order.getOrderById(orderId);
        if (!order) {
            return res.redirect('/admin/orders');
        }
        res.render('order-details', {
            order: order,
            pageTitle: 'Chi tiết đơn hàng',
            path: '/admin/orders/' + orderId,
            user: req.session.user,
            formatDate: (date) => {
                const d = new Date(date);
                return d.toLocaleString('vi-VN', { hour12: false });
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.getEditOrder = async (req, res, next) => {
    const orderId = req.params.orderId;
    try {
        const order = await Order.getOrderById(orderId);
        if (!order) {
            return res.redirect('/admin/orders');
        }
        res.render('admin/edit-order', {
            order: order,
            pageTitle: 'Chỉnh sửa đơn hàng',
            path: '/admin/orders/' + orderId + '/edit',
            formatDate: (date) => {
                const d = new Date(date);
                return d.toLocaleString('vi-VN', { hour12: false });
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.postEditOrder = async (req, res, next) => {
    const orderId = req.params.orderId;
    try {
        const order = await Order.getOrderById(orderId);
        if (!order) {
            return res.redirect('/admin/orders');
        }

        // Chỉ cập nhật thông tin khách hàng
        const updatedData = {
            customerInfo: {
                name: req.body.customerName,
                email: req.body.customerEmail,
                phone: req.body.customerPhone,
                address: req.body.customerAddress,
                wardName: req.body.wardName,
                districtName: req.body.districtName,
                provinceName: req.body.provinceName
            }
        };

        await Order.updateOrder(orderId, updatedData);
        res.redirect('/admin/orders/' + orderId);
    } catch (err) {
        next(err);
    }
};

exports.postUpdateOrderStatus = async (req, res, next) => {
    const orderId = req.body.orderId;
    const status = req.body.status;
    try {
        const order = await Order.getOrderById(orderId);
        if (!order) return res.redirect('/admin/orders');
        
        // Nếu chuyển sang huỷ, luôn cộng lại tồn kho
        if (status === 'cancelled') {
            for (const item of order.products) {
                await Product.updateOne(
                    { _id: item.id || item._id || item.productId },
                    { $inc: { stock: item.qty } }
                );
            }
        }
        
        // Nếu chuyển từ hủy về pending, trừ lại tồn kho
        if (order.status === 'cancelled' && status === 'pending') {
            for (const item of order.products) {
                await Product.updateOne(
                    { _id: item.id || item._id || item.productId },
                    { $inc: { stock: -item.qty } }
                );
            }
        }
        
        // Nếu chuyển sang hoàn thành, trừ tồn kho
        if (order.status !== 'completed' && status === 'completed') {
            for (const item of order.products) {
                await Product.updateOne(
                    { _id: item.id || item._id || item.productId },
                    { $inc: { stock: -item.qty } }
                );
            }
        }
        
        await Order.updateOrderStatus(orderId, status);
        res.redirect('/admin/orders');
    } catch (err) {
        next(err);
    }
};

exports.postDeleteOrder = async (req, res, next) => {
    const orderId = req.body.orderId;
    try {
        await Order.deleteOrder(orderId);
        res.redirect('/admin/orders');
    } catch (err) {
        next(err);
    }
};

// Thay đổi trạng thái đơn hàng
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const newStatus = req.body.status;
    const Order = require('../models/order');
    const Product = require('../models/product');
    const order = await Order.getOrderById(orderId);
    if (!order) return res.redirect('/admin/orders');
    // Nếu chuyển sang hoàn thành, trừ tồn kho
    if (order.status !== 'completed' && newStatus === 'completed') {
      for (const item of order.products) {
        await Product.updateOne({ title: item.title }, { $inc: { stock: -item.qty } });
      }
    }
    // Nếu chuyển sang huỷ, cộng lại tồn kho (nếu trước đó đã hoàn thành)
    if (order.status === 'completed' && newStatus === 'cancelled') {
      for (const item of order.products) {
        await Product.updateOne({ title: item.title }, { $inc: { stock: item.qty } });
      }
    }
    await Order.updateOrderStatus(orderId, newStatus);
        res.redirect('/admin/orders');
    } catch (err) {
        next(err);
    }
};

// API thống kê dashboard
exports.getDashboardStats = async (req, res, next) => {
    try {
        const Product = require('../models/product');
        const Order = require('../models/order');
        const User = require('../models/user');

        // Lấy dữ liệu
        const [products, orders, users] = await Promise.all([
            Product.find ? Product.find() : [], // Nếu dùng mongoose
            Order.getOrders(),
            User.find ? User.find() : []
        ]);

        // Tổng số sản phẩm
        const totalProducts = products.length;
        // Tổng số user
        const totalUsers = users.length;
        // Tổng số đơn hàng
        const totalOrders = orders.length;
        // Tổng doanh thu
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

        res.json({
            totalProducts,
            totalUsers,
            totalOrders,
            totalRevenue
        });
    } catch (err) {
        next(err);
    }
};

exports.getDashboard = async (req, res, next) => {
    try {
        const products = await Product.find();
        const users = await User.find();
        const orders = await Order.getOrders();
        // Lấy ngày hiện tại và 7 ngày trước
        const now = new Date();
        const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
        // Lọc đơn hàng trong 7 ngày gần nhất
        const weeklyOrders = orders.filter(order => {
            const created = new Date(order.createdAt);
            return created >= weekAgo && created <= now;
        });
        // Doanh thu tuần chỉ tính đơn hoàn thành
        const weeklyRevenue = weeklyOrders.filter(order => order.status === 'completed').reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        // Số đơn hàng tuần (tất cả trạng thái)
        const weeklyOrderCount = weeklyOrders.length;
        // Tổng doanh thu toàn hệ thống chỉ tính đơn hoàn thành
        const totalRevenue = orders.filter(order => order.status === 'completed').reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        const inStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
        const totalProducts = products.length;
        const stats = {
            totalProducts,
            totalRevenue,
            inStock,
            weeklyRevenue,
            weeklyOrderCount,
            totalUsers: users.length
        };
        res.render('admin/dashboard', {
            stats,
            products,
            users,
            pageTitle: 'Admin Dashboard',
            path: '/admin/dashboard',
            user: req.user // truyền user vào view
        });
    } catch (err) {
        next(err);
    }
};

// API trả về doanh thu từng ngày trong tuần cho dashboard
exports.getWeeklyRevenueChart = async (req, res, next) => {
    try {
        const orders = await Order.getOrders();
        const now = new Date();
        const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
        // Khởi tạo mảng doanh thu 7 ngày
        const dailyRevenue = Array(7).fill(0);
        // Lấy ngày trong tuần (T2 -> CN)
        const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        orders.forEach(order => {
            const created = new Date(order.createdAt);
            if (created >= weekAgo && created <= now) {
                // Tính vị trí trong mảng (0: T2, 6: CN)
                const dayIndex = (created.getDay() + 6) % 7; // getDay: 0=CN, 1=T2,...
                dailyRevenue[dayIndex] += order.totalPrice || 0;
            }
        });
        res.json({
            labels: days,
            data: dailyRevenue
        });
    } catch (err) {
        next(err);
    }
};

// API trả về dữ liệu động cho pie chart: tổng số lượng bán ra của từng sản phẩm
exports.getBestsellerPie = async (req, res, next) => {
    try {
        const Order = require('../models/order');
        // Chỉ lấy các đơn hoàn thành
        const orders = (await Order.getOrders()).filter(order => order.status === 'completed');
        const productCount = {};
        let totalSold = 0;
        orders.forEach(order => {
            (order.products || []).forEach(prod => {
                if (!productCount[prod.title]) productCount[prod.title] = 0;
                productCount[prod.title] += prod.qty || 1;
                totalSold += prod.qty || 1;
            });
        });
        // Lấy top 5 sản phẩm bán chạy nhất
        const sorted = Object.entries(productCount).sort((a, b) => b[1] - a[1]);
        const top = sorted.slice(0, 5);
        res.json({
            labels: top.map(item => item[0]),
            data: top.map(item => item[1]),
            percent: top.map(item => totalSold > 0 ? Math.round(item[1] * 1000 / totalSold) / 10 : 0) // làm tròn 1 số thập phân
        });
    } catch (err) {
        next(err);
    }
};

// API trả về số lượng đơn hàng theo từng trạng thái
exports.getOrderStatusStats = async (req, res, next) => {
    try {
        const Order = require('../models/order');
        const orders = await Order.getOrders();
        const stats = { pending: 0, processing: 0, completed: 0, cancelled: 0 };
        orders.forEach(order => {
            if (order.status && stats.hasOwnProperty(order.status)) {
                stats[order.status]++;
            }
        });
        res.json(stats);
    } catch (err) {
        next(err);
    }
};

// API trả về top 5 sản phẩm bán chạy nhất
exports.getTopBestseller = async (req, res, next) => {
    try {
        const Order = require('../models/order');
        const orders = await Order.getOrders();
        const productCount = {};
        orders.forEach(order => {
            (order.products || []).forEach(prod => {
                if (!productCount[prod.title]) productCount[prod.title] = 0;
                productCount[prod.title] += prod.qty || 1;
            });
        });
        // Lấy top 5 sản phẩm bán chạy nhất
        const sorted = Object.entries(productCount).sort((a, b) => b[1] - a[1]);
        const top = sorted.slice(0, 5);
        res.json(top.map(item => ({ title: item[0], qty: item[1] })));
    } catch (err) {
        next(err);
    }
};

// API trả về 5 đơn hàng mới nhất
exports.getLatestOrders = async (req, res, next) => {
    try {
        const Order = require('../models/order');
        const orders = await Order.getOrders();
        const sorted = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latest = sorted.slice(0, 5);
        res.json(latest);
    } catch (err) {
        next(err);
    }
};

// API trả về 5 user mới đăng ký
exports.getLatestUsers = async (req, res, next) => {
    try {
        const User = require('../models/user');
        const users = await User.find ? await User.find() : [];
        const sorted = users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latest = sorted.slice(0, 5);
        res.json(latest);
    } catch (err) {
        next(err);
    }
};

exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.render('users', {
            users,
            pageTitle: 'Quản lý người dùng',
            path: '/admin/users',
            messages: {
                error: req.flash('error'),
                success: req.flash('success')
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.getUserDetail = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.redirect('/admin/users');
        
        // Lấy đơn hàng của user
        const Order = require('../models/order');
        let orders = [];
        try {
            orders = await Order.getOrdersByUserId(user._id);
        } catch (err) {
            console.error('Error getting orders:', err);
            orders = [];
        }
        
        res.render('profile', {
            user,
            orders,
            pageTitle: 'Chi tiết người dùng',
            path: '/admin/users/' + user._id
        });
    } catch (err) {
        next(err);
    }
};

exports.postDeleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.body.userId);
        if (!user || user.role === 'admin') return res.redirect('/admin/users');
        await User.findByIdAndDelete(user._id);
        res.redirect('/admin/users');
    } catch (err) {
        next(err);
    }
};

// Cập nhật vai trò user
exports.postUpdateUserRole = async (req, res, next) => {
    try {
        const { userId, role } = req.body;
        
        // Kiểm tra user tồn tại
        const user = await User.findById(userId);
        if (!user) {
            req.flash('error', 'Không tìm thấy user!');
            return res.redirect('/admin/users');
        }
        
        // Kiểm tra quyền - chỉ admin mới có thể thay đổi vai trò
        if (req.session.user.role !== 'admin') {
            req.flash('error', 'Bạn không có quyền thực hiện thao tác này!');
            return res.redirect('/admin/users');
        }
        
        // Không cho phép thay đổi vai trò của chính mình
        if (userId === req.session.user._id.toString()) {
            req.flash('error', 'Không thể thay đổi vai trò của chính mình!');
            return res.redirect('/admin/users');
        }
        
        // Kiểm tra xem có phải đang thay đổi từ admin xuống user không
        if (user.role === 'admin' && role === 'user') {
            req.flash('error', 'Không thể hạ cấp admin xuống user!');
            return res.redirect('/admin/users');
        }
        
        // Cập nhật vai trò
        await User.findByIdAndUpdate(userId, { role });
        
        req.flash('success', `Đã cập nhật vai trò của ${user.name} thành ${role === 'admin' ? 'Admin' : 'User'}!`);
        res.redirect('/admin/users');
    } catch (err) {
        console.error('Error updating user role:', err);
        req.flash('error', 'Có lỗi xảy ra khi cập nhật vai trò!');
        res.redirect('/admin/users');
    }
};

// Bật/tắt trạng thái hoạt động của user
exports.postToggleUserActive = async (req, res, next) => {
    try {
        const { userId } = req.body;
        
        // Kiểm tra user tồn tại
        const user = await User.findById(userId);
        if (!user) {
            req.flash('error', 'Không tìm thấy user!');
            return res.redirect('/admin/users');
        }
        
        // Kiểm tra quyền - chỉ admin mới có thể thay đổi trạng thái
        if (req.session.user.role !== 'admin') {
            req.flash('error', 'Bạn không có quyền thực hiện thao tác này!');
            return res.redirect('/admin/users');
        }
        
        // Không cho phép thay đổi trạng thái của chính mình
        if (userId === req.session.user._id.toString()) {
            req.flash('error', 'Không thể thay đổi trạng thái của chính mình!');
            return res.redirect('/admin/users');
        }
        
        // Không cho phép thay đổi trạng thái của admin khác
        if (user.role === 'admin') {
            req.flash('error', 'Không thể thay đổi trạng thái của admin khác!');
            return res.redirect('/admin/users');
        }
        
        // Cập nhật trạng thái
        const newStatus = user.isActive === false ? true : false;
        await User.findByIdAndUpdate(userId, { isActive: newStatus });
        
        const statusText = newStatus ? 'kích hoạt' : 'khóa';
        req.flash('success', `Đã ${statusText} tài khoản của ${user.name}!`);
        res.redirect('/admin/users');
    } catch (err) {
        console.error('Error toggling user active:', err);
        req.flash('error', 'Có lỗi xảy ra khi thay đổi trạng thái!');
        res.redirect('/admin/users');
    }
};

exports.deleteMultipleOrders = async (req, res, next) => {
    try {
        const { orderIds } = req.body;
        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return res.json({ success: false, message: 'Không có đơn hàng nào được chọn.' });
        }
        const Order = require('../models/order');
        let deleted = 0;
        for (const id of orderIds) {
            const result = await Order.deleteOrder(id);
            if (result) deleted++;
        }
        res.json({ success: true, message: `Đã xóa ${deleted} đơn hàng.` });
    } catch (err) {
        res.json({ success: false, message: 'Lỗi khi xóa đơn hàng.' });
    }
};

exports.getAdminProfile = async (req, res, next) => {
    try {
        console.log('DEBUG ADMIN PROFILE:', req.session.user);
        const user = req.session.user;
        res.render('admin/profile', {
            user,
            pageTitle: 'Thông tin Admin',
            path: '/admin/profile'
        });
    } catch (err) {
        res.status(500).render('500', { pageTitle: 'Lỗi', path: '/500' });
    }
};

exports.getAllReviews = async (req, res, next) => {
  try {
    // Lấy tất cả đánh giá từ file
    const reviews = await Review.getAllReviews();
    // Lấy toàn bộ sản phẩm và user từ mongoose
    const Product = require('../models/product');
    const User = require('../models/user');
    const [products, users] = await Promise.all([
      Product.find(),
      User.find()
    ]);
    // Map id -> tên
    const productMap = {};
    products.forEach(p => { productMap[p._id.toString()] = p.title; });
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u.name; });
    // Gắn tên vào review
    const reviewsWithNames = reviews.map(r => ({
      ...r,
      productName: productMap[r.productId] || r.productId,
      userName: userMap[r.userId] || r.userId
    }));
    res.render('admin/reviews', {
      reviews: reviewsWithNames,
      pageTitle: 'Quản lý đánh giá',
      path: '/admin/reviews'
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    if (!req.params.id) return res.redirect('/admin/reviews');
    await Review.deleteReviewById(req.params.id);
    res.redirect('/admin/reviews');
  } catch (err) {
    next(err);
  }
};

exports.addAdminReply = async (req, res, next) => {
  try {
    const { reviewId, replyContent } = req.body;
    if (!reviewId || !replyContent || replyContent.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng nhập nội dung phản hồi' 
      });
    }

    const trimmedContent = replyContent.trim();
    if (trimmedContent.length < 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nội dung phản hồi phải có ít nhất 5 ký tự' 
      });
    }

    if (trimmedContent.length > 500) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nội dung phản hồi không được quá 500 ký tự' 
      });
    }

    await Review.addAdminReply(reviewId, trimmedContent);
    res.json({ 
      success: true, 
      message: 'Đã thêm phản hồi thành công' 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi thêm phản hồi' 
    });
  }
};

exports.updateAdminReply = async (req, res, next) => {
  try {
    const { reviewId, replyContent } = req.body;
    if (!reviewId || !replyContent || replyContent.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng nhập nội dung phản hồi' 
      });
    }

    const trimmedContent = replyContent.trim();
    if (trimmedContent.length < 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nội dung phản hồi phải có ít nhất 5 ký tự' 
      });
    }

    if (trimmedContent.length > 500) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nội dung phản hồi không được quá 500 ký tự' 
      });
    }

    await Review.updateAdminReply(reviewId, trimmedContent);
    res.json({ 
      success: true, 
      message: 'Đã cập nhật phản hồi thành công' 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi cập nhật phản hồi' 
    });
  }
};

exports.deleteAdminReply = async (req, res, next) => {
  try {
    const { reviewId } = req.body;
    if (!reviewId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không tìm thấy đánh giá' 
      });
    }

    await Review.deleteAdminReply(reviewId);
    res.json({ 
      success: true, 
      message: 'Đã xóa phản hồi thành công' 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi xóa phản hồi' 
    });
  }
};