// Middleware kiểm tra đăng nhập
function isAuth(req, res, next) {
  if (!req.session.isLoggedIn) {
    return res.redirect('/login');
  }
  next();
}

// Middleware kiểm tra quyền admin
function isAdmin(req, res, next) {
  if (!req.session.isLoggedIn || !req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/');
  }
  next();
}

// Middleware kiểm tra đăng nhập cho shop/checkout
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.session.redirectTo = req.originalUrl;
  res.redirect('/login');
}

module.exports = {
  isAuth,
  isAdmin,
  isAuthenticated
}; 