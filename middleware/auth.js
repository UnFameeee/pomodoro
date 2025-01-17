const User = require('../models/User');

// Middleware kiểm tra đăng nhập
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        if (req.xhr || req.path.startsWith('/api/')) {
            return res.status(401).json({ 
                success: false, 
                error: 'Vui lòng đăng nhập để tiếp tục' 
            });
        }
        return res.redirect('/auth/login');
    }
    next();
};

// Middleware kiểm tra người dùng hiện tại
const getCurrentUser = async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            res.locals.currentUser = user;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error);
        }
    }
    next();
};

// Middleware chuyển hướng nếu đã đăng nhập
const redirectIfAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return res.redirect('/');
    }
    next();
};

module.exports = {
    requireAuth,
    getCurrentUser,
    redirectIfAuthenticated
}; 