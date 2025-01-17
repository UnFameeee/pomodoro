const express = require('express');
const router = express.Router();
const History = require('../models/History');

// Hiển thị trang lịch sử
router.get('/', async (req, res) => {
    try {
        const userId = req.session.userId || 1;
        const history = await History.getUserHistory(userId);
        const stats = await History.getStats(userId);
        
        res.render('history', { history, stats });
    } catch (error) {
        console.error('Lỗi:', error);
        res.status(500).render('error', { message: 'Đã xảy ra lỗi khi tải trang lịch sử' });
    }
});

// API để lấy dữ liệu lịch sử theo khoảng thời gian
router.get('/api/data', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.session.userId || 1;

        const [history] = await db.execute(
            `SELECT * FROM history 
            WHERE user_id = ? 
            AND date BETWEEN ? AND ?
            ORDER BY date DESC`,
            [userId, startDate, endDate]
        );

        res.json({ success: true, history });
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu lịch sử:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi lấy dữ liệu lịch sử' });
    }
});

module.exports = router; 