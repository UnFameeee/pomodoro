const express = require('express');
const router = express.Router();
const History = require('../models/History');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const stats = await History.getDetailedStats(userId);
        res.render('stats', { stats });
    } catch (error) {
        console.error('Lỗi khi lấy thống kê:', error);
        res.status(500).render('error', { message: 'Đã xảy ra lỗi khi tải thống kê' });
    }
});

router.get('/api/time', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { range } = req.query;
        const data = await History.getTimeData(userId, range);
        res.json(data);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu thời gian:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy dữ liệu' });
    }
});

router.get('/api/heatmap', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const data = await History.getHeatmapData(userId);
        res.json(data);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu heatmap:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy dữ liệu' });
    }
});

module.exports = router; 