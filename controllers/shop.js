const Product = require('../models/product');
const Cart = require('../models/cart');
const Order = require('../models/order');
const { generateInvoice } = require('../util/pdf');
const { sendOrderConfirmation, sendOrderStatus } = require('../util/email');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const dateFormat = require('dateformat');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const Review = require('../models/review');

const ITEMS_PER_PAGE = 6;

// Đảm bảo thư mục invoices tồn tại
const invoicesDir = path.join('data', 'invoices');
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.countDocuments()
    .then(count => {
      totalItems = count;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop', {
        prods: products,
        pageTitle: 'Tất cả sản phẩm',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).render('500', {
        pageTitle: 'Lỗi',
        path: '/500'
      });
    });
};

exports.getProduct = async (req, res, next) => {
  const prodId = req.params.productId;
  try {
    const product = await Product.findById(prodId);
    let reviews = await Review.getReviewsByProductId(prodId);
    // Lấy tên user cho từng review
    const User = require('../models/user');
    for (let review of reviews) {
      const user = await User.findById(review.userId);
      review.userName = user ? user.name : 'Ẩn danh';
    }
    res.render('shop-product-detail', {
      product,
      reviews,
      pageTitle: product.title,
      path: '/products',
      user: req.user || req.session.user || null
    });
  } catch (err) {
    console.log(err);
    res.status(500).render('500', {
      pageTitle: 'Lỗi',
      path: '/500'
    });
  }
};

exports.getIndex = async (req, res, next) => {
  try {
    const q = req.query.q;
    let filter = {};
    if (q) {
      filter = { title: { $regex: q, $options: 'i' } };
    }
    // Lấy từng nhóm sản phẩm
    const [giftProducts, vietnamProducts, importProducts] = await Promise.all([
      require('../models/product').find({ ...filter, banner: 'gift' }),
      require('../models/product').find({ ...filter, banner: 'vietnam' }),
      require('../models/product').find({ ...filter, banner: 'import' })
    ]);
    res.render('shop', {
      giftProducts,
      vietnamProducts,
      importProducts,
      pageTitle: 'Shop',
      path: '/',
      q: q
    });
  } catch (err) {
    console.log(err);
    res.status(500).render('500', {
      pageTitle: 'Lỗi',
      path: '/500'
    });
  }
};

exports.getCart = (req, res, next) => {
  Cart.getCart()
    .then(cart => {
      res.render('cart', {
        path: '/cart',
        pageTitle: 'Giỏ hàng',
        products: cart.products,
        totalPrice: cart.totalPrice
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).render('500', {
        pageTitle: 'Lỗi',
        path: '/500'
      });
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return Cart.addProduct(prodId, product.price, product.title, product.imgUrl);
    })
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      console.log(err);
      res.status(500).render('500', {
        pageTitle: 'Lỗi',
        path: '/500'
      });
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Cart.deleteProduct(prodId)
    .then(() => {
      res.redirect('/cart');
    })
    .catch(err => {
      console.log(err);
      res.status(500).render('500', {
        pageTitle: 'Lỗi',
        path: '/500'
      });
    });
};

exports.postUpdateQuantity = (req, res, next) => {
  const prodId = req.body.productId;
  const action = req.body.action;
  
  Cart.updateQuantity(prodId, action)
    .then(() => {
      res.redirect('/cart');
    })
    .catch(err => {
      console.log(err);
      res.status(500).render('500', {
        pageTitle: 'Lỗi',
        path: '/500'
      });
    });
};

exports.getCheckout = (req, res, next) => {
  Cart.getCart()
    .then(cart => {
      if (!cart.products.length) {
        return res.redirect('/cart');
      }
      res.render('checkout', {
        path: '/checkout',
        pageTitle: 'Thanh toán',
        products: cart.products,
        totalPrice: cart.totalPrice
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).render('500', {
        pageTitle: 'Lỗi',
        path: '/500'
      });
    });
};

exports.postPlaceOrder = async (req, res, next) => {
  try {
    const cart = await Cart.getCart();
    if (!cart.products.length) {
      return res.redirect('/cart');
    }

    // Kiểm tra tồn kho từng sản phẩm
    for (const item of cart.products) {
      const dbProduct = await Product.findOne({ title: item.title });
      if (!dbProduct || dbProduct.stock < item.qty) {
        return res.render('checkout', {
          pageTitle: 'Thanh toán',
          path: '/checkout',
          products: cart.products,
          totalPrice: cart.totalPrice,
          errorMessage: `Sản phẩm "${item.title}" không đủ tồn kho. Vui lòng giảm số lượng hoặc chọn sản phẩm khác.`
        });
      }
    }

    // Validate dữ liệu đầu vào
    const errors = [];
    const phone = req.body.phone;
    const email = req.body.email;
    const address = req.body.address;
    const province = req.body.provinceName;
    const district = req.body.districtName;
    const ward = req.body.wardName;
    const fullName = req.body.fullName || req.body.name;
    if (!fullName || fullName.trim().length < 2) errors.push('Vui lòng nhập họ tên hợp lệ.');
    if (!phone || !/^[0-9]{8,15}$/.test(phone)) errors.push('Số điện thoại không hợp lệ.');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push('Email không hợp lệ.');
    if (!address || address.trim().length < 5) errors.push('Vui lòng nhập địa chỉ chi tiết.');
    if (!province) errors.push('Vui lòng chọn tỉnh/thành.');
    if (!district) errors.push('Vui lòng chọn quận/huyện.');
    if (!ward) errors.push('Vui lòng chọn phường/xã.');
    if (errors.length > 0) {
      return res.render('checkout', {
        pageTitle: 'Thanh toán',
        path: '/checkout',
        products: cart.products,
        totalPrice: cart.totalPrice,
        errorMessage: errors.join(' ')
      });
    }

    const customerInfo = {
      fullName: req.body.fullName || req.body.name,
      email: req.body.email,
      address: req.body.address,
      phone: req.body.phone,
      provinceName: req.body.provinceName,
      districtName: req.body.districtName,
      wardName: req.body.wardName,
      note: req.body.note
    };

    // Tạo mã đơn hàng duy nhất dựa trên timestamp
    const orderId = Date.now().toString();
    const userId = req.session.user ? req.session.user._id : null;
    
    // Lấy thông tin mã giảm giá và phí ship từ request body
    const appliedCoupon = req.body.appliedCoupon ? JSON.parse(req.body.appliedCoupon) : null;
    const shippingFee = parseFloat(req.body.shippingFee) || 0;
    const subtotal = parseFloat(req.body.subtotal) || cart.totalPrice;
    const finalTotal = parseFloat(req.body.finalTotal) || cart.totalPrice;
    
    const order = new Order(
      orderId,
      cart.products,
      customerInfo,
      finalTotal, // Sử dụng tổng tiền cuối cùng sau khi áp dụng mã giảm giá
      userId, // truyền userId nếu có
      'pending',
      new Date(),
      appliedCoupon,
      shippingFee,
      subtotal
    );

    console.log('Bắt đầu lưu đơn hàng');
    await Order.saveOrder(order);
    console.log('Lưu đơn hàng xong');
    // Sau khi lưu đơn hàng xong
    try {
      // Trừ tồn kho sản phẩm
      for (const item of cart.products) {
        await Product.updateOne(
          { _id: item.id || item._id || item.productId },
          { $inc: { stock: -item.qty } }
        );
      }
      const pdfBuffer = await generateInvoice(order);
      await sendOrderConfirmation(customerInfo.email, orderId, pdfBuffer, customerInfo);
      console.log('Đã gửi email xác nhận đơn hàng kèm hóa đơn PDF cho user');
    } catch (err) {
      console.error('Lỗi gửi email xác nhận đơn hàng:', err);
    }
    console.log('Xóa giỏ hàng');
    await Cart.deleteCart();
    console.log('Xóa giỏ hàng xong');
    console.log('Redirect');
    res.redirect('/');
  } catch (err) {
    console.log(err);
    res.status(500).render('500', {
      pageTitle: 'Lỗi',
      path: '/500'
    });
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const userEmail = req.query.email;
    let orders = [];
    
    if (userEmail) {
      orders = await Order.getOrdersByCustomerEmail(userEmail);
    } else {
      orders = await Order.getOrders();
    }
    
    // Sắp xếp đơn hàng theo thời gian tạo - mới nhất lên đầu
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.render('orders', {
      path: '/orders',
      pageTitle: 'Đơn hàng của bạn',
      orders: orders,
      formatDate: (date) => {
        const d = new Date(date);
        return d.toLocaleString('vi-VN', { hour12: false });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).render('500', {
      pageTitle: 'Lỗi',
      path: '/500'
    });
  }
};

exports.getOrderDetails = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    console.log('DEBUG getOrderDetails:', { orderId });
    const order = await Order.getOrderById(orderId);
    console.log('DEBUG order:', order);
    if (!order) {
      return res.status(404).render('404', {
        pageTitle: 'Không tìm thấy đơn hàng',
        path: '/404'
      });
    }
    res.render('order-details', {
      path: '/orders',
      pageTitle: `Đơn hàng #${orderId}`,
      order: order,
      formatDate: (date) => dateFormat(new Date(date), "dd/mm/yyyy HH:MM")
    });
  } catch (err) {
    console.log(err);
    res.status(500).render('500', {
      pageTitle: 'Lỗi',
      path: '/500'
    });
  }
};

exports.getOrderDetail = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.getOrderById(orderId);
    if (!order) {
      return res.status(404).render('404', {
        pageTitle: 'Không tìm thấy đơn hàng',
        path: '/404'
      });
    }
    // Kiểm tra quyền: chỉ cho phép admin hoặc user sở hữu đơn hàng xem
    const user = req.session.user;
    const isOwner = user && (
      (order.userId && order.userId.toString() === user._id.toString()) ||
      (order.customerInfo && order.customerInfo.email === user.email)
    );
    const isAdmin = user && user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).render('500', {
        pageTitle: 'Lỗi',
        path: '/500',
        errorMessage: 'Bạn không có quyền xem đơn hàng này.'
      });
    }
    res.render('order-details', {
      order,
      pageTitle: `Chi tiết đơn hàng #${orderId}`,
      path: '/orders/' + orderId
    });
  } catch (err) {
    console.log(err);
    res.status(500).render('500', {
      pageTitle: 'Lỗi',
      path: '/500'
    });
  }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.getOrderById(orderId);
    if (!order) {
      return res.status(404).render('404', {
        pageTitle: 'Không tìm thấy đơn hàng',
        path: '/404'
      });
    }
    // Kiểm tra quyền: chỉ cho phép admin hoặc user sở hữu đơn hàng tải hóa đơn
    const user = req.session.user;
    const isOwner = user && (
      (order.userId && order.userId.toString() === user._id.toString()) ||
      (order.customerInfo && order.customerInfo.email === user.email)
    );
    const isAdmin = user && user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).render('500', {
        pageTitle: 'Lỗi',
        path: '/500',
        errorMessage: 'Bạn không có quyền tải hóa đơn này.'
      });
    }
    const invoiceName = `invoice-${orderId}.pdf`;
    const invoicePath = path.join('data', 'invoices', invoiceName);
    // Kiểm tra xem file có tồn tại không, nếu không thì tạo mới
    if (!fs.existsSync(invoicePath)) {
      const pdfBuffer = await generateInvoice(order);
      fs.writeFileSync(invoicePath, pdfBuffer);
    }
    // Streaming file thay vì đọc hết vào bộ nhớ
    const file = fs.createReadStream(invoicePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);
    file.pipe(res);
  } catch (err) {
    console.log(err);
    res.status(500).render('500', {
      pageTitle: 'Lỗi',
      path: '/500'
    });
  }
};

exports.postUpdateOrderStatus = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const newStatus = req.body.status;
    
    if (!['pending', 'processing', 'completed', 'cancelled'].includes(newStatus)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }
    
    const updatedOrder = await Order.updateOrderStatus(orderId, newStatus);
    
    // Gửi email thông báo cập nhật trạng thái đơn hàng
    await sendOrderStatus(updatedOrder, newStatus);
    
    res.redirect(`/orders/${orderId}`);
  } catch (err) {
    console.log(err);
    res.status(500).render('500', {
      pageTitle: 'Lỗi',
      path: '/500'
    });
  }
};

// Route GET /order-success
exports.getOrderSuccess = (req, res, next) => {
  try {
    console.log('SESSION:', req.session);
    const orderId = req.session.orderId;
    console.log('orderId:', orderId);
    if (!orderId) {
      return res.status(500).render('500', {
        pageTitle: 'Lỗi',
        path: '/500',
        errorMessage: 'Không tìm thấy mã đơn hàng trong session. Có thể do session chưa được lưu hoặc đã hết hạn.'
      });
    }
    // Xóa orderId khỏi session sau khi lấy
    delete req.session.orderId;
    res.render('order-success', {
      path: '/checkout',
      pageTitle: 'Đặt hàng thành công',
      orderId: orderId
    });
  } catch (err) {
    console.error('Lỗi getOrderSuccess:', err);
    res.status(500).render('500', {
      pageTitle: 'Lỗi',
      path: '/500',
      errorMessage: 'Đã xảy ra lỗi khi xác nhận đơn hàng.'
    });
  }
};

// Hiển thị form đăng nhập
exports.getLogin = (req, res) => {
  res.render('login', {
    errorMessage: req.flash('error')
  });
};

// Xử lý đăng nhập
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Email không tồn tại!');
      return res.redirect('/login');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error', 'Mật khẩu không đúng!');
      return res.redirect('/login');
    }
    req.session.isLoggedIn = true;
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    await req.session.save();
    const redirectTo = req.session.redirectTo || (user.role === 'admin' ? '/admin/dashboard' : '/');
    delete req.session.redirectTo;
    res.redirect(redirectTo);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi, vui lòng thử lại!');
    res.redirect('/login');
  }
};

// Hiển thị form đăng ký
exports.getRegister = (req, res) => {
  res.render('register', {
    errorMessage: req.flash('error')
  });
};

// Xử lý đăng ký
exports.postRegister = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  try {
    if (password !== confirmPassword) {
      req.flash('error', 'Mật khẩu xác nhận không khớp!');
      return res.redirect('/register');
    }
    const existing = await User.findOne({ email });
    if (existing) {
      req.flash('error', 'Email đã được sử dụng!');
      return res.redirect('/register');
    }
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hash, role: 'user' });
    await user.save();
    req.flash('success', 'Đăng ký thành công! Hãy đăng nhập.');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi, vui lòng thử lại!');
    res.redirect('/register');
  }
};

// Trang profile user (bảo vệ bằng isAuth)
exports.getProfile = async (req, res) => {
  try {
    const user = req.session.user;
    const Order = require('../models/order');
    let orders = [];
    if (user && user._id) {
      orders = await Order.getOrdersByUserId(user._id);
    } else {
      orders = await Order.getOrdersByCustomerEmail(user.email);
    }
    res.render('profile', {
      user,
      orders,
      pageTitle: 'Thông tin cá nhân',
      path: '/profile'
    });
  } catch (err) {
    console.error(err);
    res.render('profile', {
      user: req.session.user,
      orders: [],
      pageTitle: 'Thông tin cá nhân',
      path: '/profile',
      errorMessage: 'Không lấy được danh sách đơn hàng'
    });
  }
};

// Cập nhật họ tên
exports.postUpdateInfo = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const newName = req.body.name;
    await User.findByIdAndUpdate(userId, { name: newName });
    req.session.user.name = newName;
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.redirect('/profile');
  }
};
// Cập nhật email
exports.postUpdateEmail = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const newEmail = req.body.email;
    // Kiểm tra email đã tồn tại chưa
    const existing = await User.findOne({ email: newEmail });
    if (existing && existing._id.toString() !== userId) {
      // Email đã tồn tại cho user khác
      return res.redirect('/profile');
    }
    await User.findByIdAndUpdate(userId, { email: newEmail });
    req.session.user.email = newEmail;
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.redirect('/profile');
  }
};
// Đổi mật khẩu
exports.postUpdatePassword = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(userId);
    console.log('USER:', user);
    if (!user) return res.redirect('/profile');
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    console.log('isMatch:', isMatch, 'oldPassword:', oldPassword, 'user.password:', user.password);
    if (!isMatch) {
      req.flash('error', 'Mật khẩu cũ không đúng!');
      return res.redirect('/profile');
    }
    if (newPassword !== confirmPassword) {
      req.flash('error', 'Mật khẩu xác nhận không khớp!');
      return res.redirect('/profile');
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password: hash });
    req.flash('success', 'Đổi mật khẩu thành công!');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đã xảy ra lỗi, vui lòng thử lại!');
    res.redirect('/profile');
  }
};

// Đăng xuất
exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    res.redirect('/');
  });
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.getOrderById(orderId);
    if (!order) return res.status(404).render('404', { pageTitle: 'Không tìm thấy đơn hàng', path: '/404' });
    
    // Kiểm tra quyền
    const user = req.session.user;
    const isOwner = user && (
      (order.userId && order.userId.toString() === user._id.toString()) ||
      (order.customerInfo && order.customerInfo.email === user.email)
    );
    const isAdmin = user && user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).render('500', { pageTitle: 'Lỗi', path: '/500', errorMessage: 'Bạn không có quyền hủy đơn hàng này.' });
    }
    
    // Chỉ cho phép hủy nếu đơn chưa hoàn thành/hủy
    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.redirect('/orders/' + orderId);
    }
    
    // Nếu đơn đang xử lý, chỉ cho phép admin hủy
    if (order.status === 'processing' && !isAdmin) {
      return res.redirect('/orders/' + orderId);
    }
    
    // Hủy đơn hàng
    await Order.updateOrderStatus(orderId, 'cancelled');
    
    // Hoàn trả tồn kho sản phẩm nếu đơn đã được xử lý
    if (order.status === 'processing') {
      const Product = require('../models/product');
      for (const item of order.products) {
        await Product.updateOne(
          { _id: item.id || item._id || item.productId },
          { $inc: { stock: item.qty } }
        );
      }
    }
    
    res.redirect('/orders/' + orderId);
  } catch (err) {
    console.log(err);
    res.status(500).render('500', { pageTitle: 'Lỗi', path: '/500' });
  }
};

// Thêm hàm để hủy yêu cầu hủy đơn hàng
exports.cancelCancelRequest = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.getOrderById(orderId);
    if (!order) return res.status(404).render('404', { pageTitle: 'Không tìm thấy đơn hàng', path: '/404' });
    
    // Kiểm tra quyền
    const user = req.session.user;
    const isOwner = user && (
      (order.userId && order.userId.toString() === user._id.toString()) ||
      (order.customerInfo && order.customerInfo.email === user.email)
    );
    const isAdmin = user && user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).render('500', { pageTitle: 'Lỗi', path: '/500', errorMessage: 'Bạn không có quyền thực hiện thao tác này.' });
    }
    
    // Chỉ cho phép hủy yêu cầu hủy nếu đơn hàng đã bị hủy
    if (order.status !== 'cancelled') {
      return res.redirect('/orders/' + orderId);
    }
    
    // Khôi phục đơn hàng về trạng thái pending
    await Order.updateOrderStatus(orderId, 'pending');
    
    res.redirect('/orders/' + orderId);
  } catch (err) {
    console.log(err);
    res.status(500).render('500', { pageTitle: 'Lỗi', path: '/500' });
  }
};

exports.postReview = async (req, res, next) => {
  try {
    console.log('POST BODY:', req.body);
    const { productId, orderId, rating, comment } = req.body;
    const user = req.session.user;
    // Thêm log debug
    console.log('DEBUG REVIEW:', { orderId, productId, user });
    if (!user) return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập để đánh giá.' });

    // Nếu có orderId thì kiểm tra như cũ (đánh giá trong đơn hàng)
    if (orderId) {
      const existed = await Review.getReviewByOrderAndProduct(orderId, productId);
      console.log('DEBUG EXISTED:', existed);
      if (existed) return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này trong đơn hàng này.' });
      const order = await Order.getOrderById(orderId);
      console.log('DEBUG ORDER:', order);
      if (!order || order.status !== 'completed') return res.status(400).json({ success: false, message: 'Chỉ được đánh giá khi đơn hàng đã hoàn thành.' });
      const hasProduct = order.products.some(p =>
        p._id === productId ||
        p.productId === productId ||
        p.id === productId
      );
      if (!hasProduct) return res.status(400).json({ success: false, message: 'Sản phẩm không thuộc đơn hàng này.' });
      // Lưu đánh giá
      const review = new Review(productId, user._id, orderId, Number(rating), comment);
      await Review.addReview(review);
      return res.json({ success: true, message: 'Đánh giá thành công!' });
    }

    // Nếu không có orderId (đánh giá tự do ở trang chi tiết sản phẩm)
    const review = new Review(productId, user._id, null, Number(rating), comment);
    await Review.addReview(review);
    return res.json({ success: true, message: 'Đánh giá thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi đánh giá.' });
  }
};

exports.getReviewApi = async (req, res, next) => {
  try {
    const { orderId, productId } = req.query;
    if (!orderId || !productId) return res.json({ review: null });
    const review = await Review.getReviewByOrderAndProduct(orderId, productId);
    res.json({ review });
  } catch (err) {
    res.json({ review: null });
  }
};

exports.getVietnamCollection = async (req, res, next) => {
  try {
    const { sort } = req.query;
    let filter = { banner: 'vietnam' };
    let sortOption = {};
    switch (sort) {
      case 'price-asc': sortOption.price = 1; break;
      case 'price-desc': sortOption.price = -1; break;
      case 'name-asc': sortOption.title = 1; break;
      case 'name-desc': sortOption.title = -1; break;
      case 'oldest': sortOption.createdAt = 1; break;
      case 'newest': sortOption.createdAt = -1; break;
      case 'stock-desc': sortOption.stock = -1; break;
      // case 'bestseller': // cần thêm trường bán chạy nếu có
      default: break;
    }
    const products = await require('../models/product').find(filter).sort(sortOption);
    res.render('collection-vietnam', {
      products,
      pageTitle: 'Trái cây Việt Nam',
      path: '/collections/trai-cay-viet-nam',
      sort
    });
  } catch (err) {
    console.log(err);
    res.status(500).render('500', {
      pageTitle: 'Lỗi',
      path: '/500'
    });
  }
};

exports.getGiftCollection = async (req, res, next) => {
  try {
    const { sort } = req.query;
    let filter = { banner: 'gift' };
    let sortOption = {};
    switch (sort) {
      case 'price-asc': sortOption.price = 1; break;
      case 'price-desc': sortOption.price = -1; break;
      case 'name-asc': sortOption.title = 1; break;
      case 'name-desc': sortOption.title = -1; break;
      case 'oldest': sortOption.createdAt = 1; break;
      case 'newest': sortOption.createdAt = -1; break;
      case 'stock-desc': sortOption.stock = -1; break;
      // case 'bestseller': // cần thêm trường bán chạy nếu có
      default: break;
    }
    const products = await require('../models/product').find(filter).sort(sortOption);
    res.render('collection-gift', {
      products,
      pageTitle: 'Quà tặng trái cây',
      path: '/collections/qua-tang-trai-cay',
      sort
    });
  } catch (err) {
    console.log(err);
    res.status(500).render('500', {
      pageTitle: 'Lỗi',
      path: '/500'
    });
  }
};

exports.getImportCollection = async (req, res, next) => {
  try {
    const { sort } = req.query;
    let filter = { banner: 'import' };
    let sortOption = {};
    switch (sort) {
      case 'price-asc': sortOption.price = 1; break;
      case 'price-desc': sortOption.price = -1; break;
      case 'name-asc': sortOption.title = 1; break;
      case 'name-desc': sortOption.title = -1; break;
      case 'oldest': sortOption.createdAt = 1; break;
      case 'newest': sortOption.createdAt = -1; break;
      case 'stock-desc': sortOption.stock = -1; break;
      // case 'bestseller': // cần thêm trường bán chạy nếu có
      default: break;
    }
    const products = await require('../models/product').find(filter).sort(sortOption);
    res.render('collection-import', {
      products,
      pageTitle: 'Trái cây nhập khẩu',
      path: '/collections/trai-cay-nhap-khau',
      sort
    });
  } catch (err) {
    console.log(err);
    res.status(500).render('500', {
      pageTitle: 'Lỗi',
      path: '/500'
    });
  }
};
