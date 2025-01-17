const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Trang chủ
router.get('/', async (req, res) => {
    try {
        // Lấy cài đặt mặc định hoặc cài đặt của user nếu đã đăng nhập
        const settings = {
            work_time: 25,
            short_break: 5,
            long_break: 15
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

        res.render('index', { settings });
    } catch (error) {
        console.error('Lỗi:', error);
        res.status(500).render('error', { message: 'Đã xảy ra lỗi khi tải trang' });
    }
});

// API endpoint để lưu chu kỳ hoàn thành
router.post('/api/history/save', async (req, res) => {
    try {
        const { completedCycles, totalWorkTime } = req.body;
        const userId = req.session.userId || 1; // Sử dụng user mặc định nếu chưa đăng nhập
        const today = new Date().toISOString().split('T')[0];

        // Kiểm tra xem đã có bản ghi cho ngày hôm nay chưa
        const [existingRecord] = await db.execute(
            'SELECT * FROM history WHERE user_id = ? AND date = ?',
            [userId, today]
        );

        if (existingRecord.length > 0) {
            // Cập nhật bản ghi hiện có
            await db.execute(
                `UPDATE history 
                SET completed_cycles = completed_cycles + ?,
                    total_work_time = total_work_time + ?
                WHERE user_id = ? AND date = ?`,
                [completedCycles, totalWorkTime, userId, today]
            );
        } else {
            // Tạo bản ghi mới
            await db.execute(
                `INSERT INTO history (user_id, date, completed_cycles, total_work_time)
                VALUES (?, ?, ?, ?)`,
                [userId, today, completedCycles, totalWorkTime]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Lỗi khi lưu lịch sử:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi lưu lịch sử' });
    }
});

module.exports = router; 