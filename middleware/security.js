const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const csrf = require('csurf');
const sanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // Giới hạn 100 request mỗi IP
    message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút'
});

// Rate limiting cho đăng nhập
const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 5, // Giới hạn 5 lần đăng nhập thất bại
    message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 1 giờ'
});

// Cấu hình helmet
const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
            styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'],
            imgSrc: ["'self'", 'data:', 'blob:'],
            fontSrc: ["'self'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
};

// Kiểm tra mật khẩu mạnh
const passwordStrength = (req, res, next) => {
    const { password } = req.body;
    
    if (password && req.path.includes('password')) {
        const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        
        if (!strongPassword.test(password)) {
            return res.status(400).json({
                error: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
            });
        }
    }
    
    next();
};

// Kiểm tra session hợp lệ
const validateSession = (req, res, next) => {
    if (req.session && req.session.userId) {
        if (!req.session.created || Date.now() - req.session.created > 24 * 60 * 60 * 1000) {
            // Session quá hạn sau 24 giờ
            req.session.destroy();
            return res.redirect('/auth/login');
        }
        // Cập nhật thời gian hoạt động
        req.session.lastActive = Date.now();
    }
    next();
};

// Kiểm tra hoạt động
const checkInactivity = (req, res, next) => {
    if (req.session && req.session.lastActive) {
        const inactiveTime = Date.now() - req.session.lastActive;
        if (inactiveTime > 30 * 60 * 1000) { // 30 phút không hoạt động
            req.session.destroy();
            return res.redirect('/auth/login');
        }
    }
    next();
};

module.exports = {
    limiter,
    loginLimiter,
    helmetConfig,
    passwordStrength,
    validateSession,
    checkInactivity,
    securityMiddleware: [
        helmet(helmetConfig),
        sanitize(),
        xss(),
        csrf({ 
            cookie: {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production'
            }
        })
    ]
}; 