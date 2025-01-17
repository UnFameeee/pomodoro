const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { redirectIfAuthenticated } = require('../middleware/auth');
const bcrypt = require('bcrypt');

// Trang đăng nhập
router.get('/login', redirectIfAuthenticated, (req, res) => {
    res.render('auth/login', { error: null });
});

// Xử lý đăng nhập
router.post('/login', redirectIfAuthenticated, async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render('auth/login', {
                error: 'Email hoặc mật khẩu không chính xác'
            });
        }

        req.session.userId = user.id;
        res.redirect('/');
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.render('auth/login', {
            error: 'Đã xảy ra lỗi khi đăng nhập'
        });
    }
});

// Trang đăng ký
router.get('/register', redirectIfAuthenticated, (req, res) => {
    res.render('auth/register', { error: null });
});

// Xử lý đăng ký
router.post('/register', redirectIfAuthenticated, async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        // Kiểm tra mật khẩu xác nhận
        if (password !== confirmPassword) {
            return res.render('auth/register', {
                error: 'Mật khẩu xác nhận không khớp'
            });
        }

        // Kiểm tra email đã tồn tại
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.render('auth/register', {
                error: 'Email đã được sử dụng'
            });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo người dùng mới
        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        // Tự động đăng nhập sau khi đăng ký
        req.session.userId = user.id;
        res.redirect('/');
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.render('auth/register', {
            error: 'Đã xảy ra lỗi khi đăng ký'
        });
    }
});

// Đăng xuất
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Lỗi khi đăng xuất:', err);
        }
        res.redirect('/auth/login');
    });
});

module.exports = router; 