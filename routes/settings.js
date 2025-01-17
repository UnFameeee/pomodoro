const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Hiển thị trang cài đặt
router.get('/', async (req, res) => {
    try {
        let settings = {
            work_time: 25,
            short_break: 5,
            long_break: 15,
            notifications: true
        };

        if (req.session.userId) {
            const [userSettings] = await db.execute(
                'SELECT * FROM settings WHERE user_id = ?',
                [req.session.userId]
            );
            if (userSettings.length > 0) {
                settings = userSettings[0];
            }
        }

        res.render('settings', { settings });
    } catch (error) {
        console.error('Lỗi:', error);
        res.status(500).render('error', { message: 'Đã xảy ra lỗi khi tải trang cài đặt' });
    }
});

// Lưu cài đặt
router.post('/save', async (req, res) => {
    try {
        const { workTime, shortBreak, longBreak, notifications } = req.body;
        const userId = req.session.userId || 1; // Sử dụng user mặc định nếu chưa đăng nhập

        // Kiểm tra giá trị hợp lệ
        if (workTime < 1 || workTime > 60 || 
            shortBreak < 1 || shortBreak > 30 ||
            longBreak < 1 || longBreak > 60) {
            return res.status(400).json({
                success: false,
                error: 'Giá trị thời gian không hợp lệ'
            });
        }

        // Kiểm tra xem user đã có cài đặt chưa
        const [existingSettings] = await db.execute(
            'SELECT * FROM settings WHERE user_id = ?',
            [userId]
        );

        if (existingSettings.length > 0) {
            // Cập nhật cài đặt hiện có
            await db.execute(
                `UPDATE settings 
                SET work_time = ?, short_break = ?, long_break = ?
                WHERE user_id = ?`,
                [workTime, shortBreak, longBreak, userId]
            );
        } else {
            // Tạo cài đặt mới
            await db.execute(
                `INSERT INTO settings (user_id, work_time, short_break, long_break)
                VALUES (?, ?, ?, ?)`,
                [userId, workTime, shortBreak, longBreak]
            );
        }

        // Gửi event để cập nhật timer
        res.json({
            success: true,
            settings: { workTime, shortBreak, longBreak, notifications }
        });
    } catch (error) {
        console.error('Lỗi khi lưu cài đặt:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi lưu cài đặt' });
    }
});

module.exports = router; 