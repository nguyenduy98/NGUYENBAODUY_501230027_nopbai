require('dotenv').config();

const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const MongoDBStore = require('connect-mongodb-session')(session);

const { initDb } = require('./util/database');
const Cart = require('./models/cart');

const app = express();

//Khai báo engine
app.set('view engine', 'ejs');
app.set('views', 'views')

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baoduyshop';
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

// Thêm session middleware
app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 ngày
}));

// Gán req.user từ session nếu có
app.use((req, res, next) => {
    if (!req.user && req.session && req.session.user) {
        req.user = req.session.user;
    }
    next();
});

// Thêm flash messages
app.use(flash());

// Thêm biến locals cho flash messages
app.use((req, res, next) => {
    res.locals.successMessage = req.flash('success');
    res.locals.errorMessage = req.flash('error');
    res.locals.user = req.user; // luôn gán user cho mọi view
    next();
});

// Middleware lấy số lượng sản phẩm trong giỏ hàng cho mọi view
app.use(async (req, res, next) => {
    try {
        const cart = await Cart.getCart();
        // Tính tổng số lượng sản phẩm (tổng qty)
        const cartCount = cart.products ? cart.products.reduce((sum, item) => sum + (item.qty || 0), 0) : 0;
        res.locals.cartCount = cartCount;
    } catch (err) {
        res.locals.cartCount = 0;
    }
    next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use((req, res, next) => {
    res.status(404).render('404', { 
        pageTitle: 'Page not found',
        path: '/404'
    });
});

// Khởi tạo kết nối Mongoose và khởi động server
initDb()
    .then(() => {
        app.listen(3000, () => {
            console.log('Server đang chạy tại http://localhost:3000');
        });
    })
    .catch(err => {
        console.error('Lỗi kết nối đến database:', err);
    });

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
