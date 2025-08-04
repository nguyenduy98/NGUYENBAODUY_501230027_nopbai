const Coupon = require('../models/coupon');

exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.render('admin/coupons', {
      coupons,
      pageTitle: 'Quản lý mã giảm giá',
      path: '/admin/coupons'
    });
  } catch (err) {
    next(err);
  }
};

exports.getAddCoupon = (req, res) => {
  res.render('admin/add-coupon', {
    pageTitle: 'Thêm mã giảm giá',
    path: '/admin/coupons/add',
    errorMessage: null
  });
};

exports.postAddCoupon = async (req, res, next) => {
  try {
    const { code, type, value, minOrder, maxDiscount, quantity, startDate, endDate } = req.body;
    
    // Xử lý maxDiscount - chuyển thành số hoặc null
    let processedMaxDiscount = null;
    if (maxDiscount && maxDiscount.trim() !== '') {
      processedMaxDiscount = parseInt(maxDiscount);
      if (isNaN(processedMaxDiscount) || processedMaxDiscount <= 0) {
        return res.render('admin/add-coupon', {
          pageTitle: 'Thêm mã giảm giá',
          path: '/admin/coupons/add',
          errorMessage: 'Giảm tối đa phải là số dương!'
        });
      }
    }
    
    const coupon = new Coupon({
      code,
      type,
      value: parseInt(value),
      minOrder: minOrder ? parseInt(minOrder) : 0,
      maxDiscount: processedMaxDiscount,
      quantity: parseInt(quantity),
      startDate: startDate || new Date(),
      endDate: endDate || null
    });
    await coupon.save();
    res.redirect('/admin/coupons');
  } catch (err) {
    res.render('admin/add-coupon', {
      pageTitle: 'Thêm mã giảm giá',
      path: '/admin/coupons/add',
      errorMessage: 'Có lỗi xảy ra hoặc mã đã tồn tại!'
    });
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.redirect('/admin/coupons');
  } catch (err) {
    next(err);
  }
};

exports.checkCoupon = async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const total = Number(req.query.total) || 0;
    const userId = req.user ? req.user._id : null;
    const coupon = await Coupon.findOne({ code });
    
    if (!coupon) return res.json({ success: false, message: 'Mã không tồn tại!' });
    
    const now = new Date();
    if (coupon.endDate && now > coupon.endDate) return res.json({ success: false, message: 'Mã đã hết hạn!' });
    if (coupon.quantity > 0 && coupon.used >= coupon.quantity) return res.json({ success: false, message: 'Mã đã hết lượt sử dụng!' });
    if (coupon.minOrder && total < coupon.minOrder) return res.json({ success: false, message: 'Đơn hàng chưa đủ điều kiện sử dụng mã này!' });
    
    // Kiểm tra xem user đã sử dụng voucher này chưa
    if (userId && coupon.usedBy && coupon.usedBy.includes(userId)) {
      return res.json({ success: false, message: 'Bạn đã sử dụng mã này rồi!' });
    }
    
    return res.json({ success: true, coupon });
  } catch (err) {
    res.json({ success: false, message: 'Lỗi kiểm tra mã!' });
  }
};

// Thêm endpoint để ghi lại khi user sử dụng voucher
exports.useCoupon = async (req, res) => {
  try {
    const { couponId } = req.body;
    const userId = req.user ? req.user._id : null;
    
    if (!userId) {
      return res.json({ success: false, message: 'Vui lòng đăng nhập để sử dụng voucher!' });
    }
    
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.json({ success: false, message: 'Voucher không tồn tại!' });
    }
    
    // Kiểm tra xem user đã sử dụng voucher này chưa
    if (coupon.usedBy && coupon.usedBy.includes(userId)) {
      return res.json({ success: false, message: 'Bạn đã sử dụng mã này rồi!' });
    }
    
    // Thêm user vào danh sách đã sử dụng
    if (!coupon.usedBy) {
      coupon.usedBy = [];
    }
    coupon.usedBy.push(userId);
    coupon.used = (coupon.used || 0) + 1;
    
    await coupon.save();
    
    res.json({ success: true, message: 'Đã ghi lại việc sử dụng voucher!' });
  } catch (err) {
    res.json({ success: false, message: 'Lỗi khi ghi lại việc sử dụng voucher!' });
  }
};

exports.getAvailableCoupons = async (req, res) => {
  try {
    const total = Number(req.query.total) || 0;
    const userId = req.user ? req.user._id : null; // Lấy user ID nếu đã đăng nhập
    const now = new Date();
    
    // Lấy tất cả vouchers còn hiệu lực
    let coupons = await Coupon.find({
      $and: [
        { $or: [{ endDate: { $gt: now } }, { endDate: null }] },
        { $or: [{ quantity: { $gt: 0 } }, { quantity: 0 }] },
        { $expr: { $or: [{ $eq: ['$quantity', 0] }, { $lt: ['$used', '$quantity'] }] } },
        { $or: [{ minOrder: { $lte: total } }, { minOrder: 0 }, { minOrder: null }] }
      ]
    }).sort({ createdAt: -1 });

    // Nếu user đã đăng nhập, lọc ra các voucher mà user chưa sử dụng
    if (userId) {
      coupons = coupons.filter(coupon => {
        // Kiểm tra xem user đã sử dụng voucher này chưa
        return !coupon.usedBy || !coupon.usedBy.includes(userId);
      });
    }

    res.json({ success: true, coupons });
  } catch (err) {
    res.json({ success: false, message: 'Lỗi khi lấy danh sách voucher!' });
  }
}; 