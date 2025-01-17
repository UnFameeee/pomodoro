const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const bcrypt = require('bcrypt');

// Trang thông tin tài khoản
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        res.render('account/profile', { 
            user,
            messages: req.session.messages || {}
        });
        delete req.session.messages;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        res.status(500).render('error', { message: 'Đã xảy ra lỗi' });
    }
});

// Cập nhật thông tin cá nhân
router.post('/update-profile', requireAuth, async (req, res) => {
    try {
        const { username, email } = req.body;
        const userId = req.session.userId;

        // Kiểm tra email đã tồn tại
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser.id !== userId) {
            req.session.messages = { error: 'Email đã được sử dụng' };
            return res.redirect('/account/profile');
        }

        // Cập nhật thông tin
        await User.update(userId, { username, email });
        req.session.messages = { success: 'Cập nhật thông tin thành công' };
        res.redirect('/account/profile');
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin:', error);
        req.session.messages = { error: 'Đã xảy ra lỗi khi cập nhật' };
        res.redirect('/account/profile');
    }
});

// Đổi mật khẩu
router.post('/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const user = await User.findById(req.session.userId);

        // Kiểm tra mật khẩu hiện tại
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            req.session.messages = { error: 'Mật khẩu hiện tại không chính xác' };
            return res.redirect('/account/profile');
        }

        // Kiểm tra mật khẩu mới
        if (newPassword !== confirmPassword) {
            req.session.messages = { error: 'Mật khẩu xác nhận không khớp' };
            return res.redirect('/account/profile');
        }

        // Cập nhật mật khẩu
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.update(user.id, { password: hashedPassword });

        req.session.messages = { success: 'Đổi mật khẩu thành công' };
        res.redirect('/account/profile');
    } catch (error) {
        console.error('Lỗi khi đổi mật khẩu:', error);
        req.session.messages = { error: 'Đã xảy ra lỗi khi đổi mật khẩu' };
        res.redirect('/account/profile');
    }
});

// Xóa tài khoản
router.post('/delete', requireAuth, async (req, res) => {
    try {
        const { confirmDelete } = req.body;
        if (confirmDelete !== 'DELETE') {
            req.session.messages = { error: 'Xác nhận xóa không chính xác' };
            return res.redirect('/account/profile');
        }

        await User.delete(req.session.userId);
        req.session.destroy();
        res.redirect('/auth/login');
    } catch (error) {
        console.error('Lỗi khi xóa tài khoản:', error);
        req.session.messages = { error: 'Đã xảy ra lỗi khi xóa tài khoản' };
        res.redirect('/account/profile');
    }
});

module.exports = router; 