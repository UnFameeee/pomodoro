const express = require('express');
const router = express.Router();
const History = require('../models/History');
const Setting = require('../models/Setting');
const User = require('../models/User');

// API lấy thống kê tổng quan
router.get('/stats/overview', async (req, res) => {
    try {
        const userId = req.session.userId || 1;
        const stats = await History.getStats(userId);
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Lỗi khi lấy thống kê:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi lấy thống kê' });
    }
});

// API lấy thống kê theo ngày
router.get('/stats/daily', async (req, res) => {
    try {
        const userId = req.session.userId || 1;
        const { startDate, endDate } = req.query;
        
        const history = await History.getHistoryByDateRange(userId, startDate, endDate);
        const dailyStats = history.map(record => ({
            date: record.date,
            completedCycles: record.completed_cycles,
            totalWorkTime: record.total_work_time
        }));

        res.json({
            success: true,
            data: dailyStats
        });
    } catch (error) {
        console.error('Lỗi khi lấy thống kê theo ngày:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi lấy thống kê theo ngày' });
    }
});

// API lấy và cập nhật cài đặt
router.get('/settings', async (req, res) => {
    try {
        const userId = req.session.userId || 1;
        const settings = await Setting.findByUserId(userId) || await Setting.getDefaultSettings();
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Lỗi khi lấy cài đặt:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi lấy cài đặt' });
    }
});

// API cập nhật cài đặt
router.put('/settings', async (req, res) => {
    try {
        const userId = req.session.userId || 1;
        const settings = await Setting.createOrUpdate(userId, req.body);
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật cài đặt:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi cập nhật cài đặt' });
    }
});

// API lưu chu kỳ Pomodoro hoàn thành
router.post('/pomodoro/complete', async (req, res) => {
    try {
        const userId = req.session.userId || 1;
        const { cycleType, duration } = req.body;
        const today = new Date().toISOString().split('T')[0];

        const data = {
            date: today,
            completed_cycles: 1,
            total_work_time: duration
        };

        const record = await History.addOrUpdateRecord(userId, data);

        res.json({
            success: true,
            data: record
        });
    } catch (error) {
        console.error('Lỗi khi lưu chu kỳ hoàn thành:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi lưu chu kỳ hoàn thành' });
    }
});

// API lấy lịch sử làm việc chi tiết
router.get('/history/detailed', async (req, res) => {
    try {
        const userId = req.session.userId || 1;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const [history, total] = await Promise.all([
            History.getUserHistory(userId, limit, offset),
            History.getTotalRecords(userId)
        ]);

        res.json({
            success: true,
            data: {
                history,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total
                }
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy lịch sử chi tiết:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi lấy lịch sử chi tiết' });
    }
});

// API xóa lịch sử
router.delete('/history', async (req, res) => {
    try {
        const userId = req.session.userId || 1;
        const { startDate, endDate } = req.body;

        await History.deleteRecords(userId, startDate, endDate);

        res.json({
            success: true,
            message: 'Đã xóa lịch sử thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa lịch sử:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi xóa lịch sử' });
    }
});

// API xuất dữ liệu thống kê
router.get('/export/stats', async (req, res) => {
    try {
        const userId = req.session.userId || 1;
        const { format = 'json', startDate, endDate } = req.query;

        const data = await History.getHistoryByDateRange(userId, startDate, endDate);
        
        if (format === 'csv') {
            const csv = await History.exportToCSV(data);
            res.header('Content-Type', 'text/csv');
            res.attachment('pomodoro-stats.csv');
            return res.send(csv);
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Lỗi khi xuất dữ liệu:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi xuất dữ liệu' });
    }
});

module.exports = router; 