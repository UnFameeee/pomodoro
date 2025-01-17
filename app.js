const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const security = require('./middleware/security');
const cookieParser = require('cookie-parser');

const app = express();

// Cấu hình middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: 'pomodoro-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Thêm middleware bảo mật và tối ưu
app.use(helmet()); // Bảo mật headers
app.use(compression()); // Nén response
app.use(cors()); // Cấu hình CORS

// Cache static files
app.use(express.static('public', {
    maxAge: '1d',
    etag: true
}));

// Cache control cho API responses
const cacheControl = (duration) => {
    return (req, res, next) => {
        if (req.method === 'GET') {
            res.set('Cache-Control', `public, max-age=${duration}`);
        } else {
            res.set('Cache-Control', 'no-store');
        }
        next();
    };
};

// Áp dụng cache cho các routes
app.use('/api/stats', cacheControl(300)); // Cache 5 phút cho stats API

// Routes
const indexRouter = require('./routes/index');
const settingsRouter = require('./routes/settings');
const historyRouter = require('./routes/history');
const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth');
const { getCurrentUser } = require('./middleware/auth');
const accountRouter = require('./routes/account');
const reportsRouter = require('./routes/reports');

// Thêm cookie-parser
app.use(cookieParser()); // Thêm trước csrf

// Thêm middleware bảo mật
app.use(security.securityMiddleware);
app.use(security.validateSession);
app.use(security.checkInactivity);
app.use('/api', security.limiter);
app.use('/auth/login', security.loginLimiter);

// Thêm CSRF token cho tất cả view
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

// Sau đó mới đến các routes
app.use('/', indexRouter);
app.use(getCurrentUser);
app.use('/auth', authRouter);

// Bảo vệ các routes cần xác thực
const { requireAuth } = require('./middleware/auth');
app.use('/settings', requireAuth, settingsRouter);
app.use('/history', requireAuth, historyRouter);
app.use('/api', requireAuth, apiRouter);
app.use('/account', requireAuth, accountRouter);
app.use('/reports', requireAuth, reportsRouter);

// Xử lý lỗi CSRF
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).render('error', {
            message: 'Phiên làm việc đã hết hạn, vui lòng thử lại'
        });
    }
    next(err);
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
}); 