const express = require('express');
const router = express.Router();
const History = require('../models/History');
const { requireAuth } = require('../middleware/auth');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');

// Trang xuất báo cáo
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const stats = await History.getDetailedStats(userId);
        res.render('reports/index', { stats });
    } catch (error) {
        console.error('Lỗi khi tải trang báo cáo:', error);
        res.status(500).render('error', { message: 'Đã xảy ra lỗi' });
    }
});

// Xuất báo cáo Excel
router.get('/excel', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { startDate, endDate } = req.query;
        const data = await History.getHistoryByDateRange(userId, startDate, endDate);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Pomodoro Report');

        // Thiết lập header
        worksheet.columns = [
            { header: 'Ngày', key: 'date', width: 15 },
            { header: 'Số chu kỳ hoàn thành', key: 'completed_cycles', width: 20 },
            { header: 'Thời gian làm việc (phút)', key: 'total_work_time', width: 25 }
        ];

        // Thêm dữ liệu
        worksheet.addRows(data);

        // Thêm tổng kết
        const totalRow = worksheet.addRow({
            date: 'Tổng cộng',
            completed_cycles: data.reduce((sum, row) => sum + row.completed_cycles, 0),
            total_work_time: data.reduce((sum, row) => sum + row.total_work_time, 0)
        });
        totalRow.font = { bold: true };

        // Thiết lập response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=pomodoro-report-${startDate}-${endDate}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Lỗi khi xuất Excel:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xuất báo cáo' });
    }
});

// Xuất báo cáo PDF
router.get('/pdf', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { startDate, endDate } = req.query;
        const data = await History.getHistoryByDateRange(userId, startDate, endDate);
        const stats = await History.getDetailedStats(userId);

        const doc = new PDFDocument();
        doc.pipe(res);

        // Thiết lập header
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=pomodoro-report-${startDate}-${endDate}.pdf`);

        // Tạo báo cáo
        doc.fontSize(20).text('Báo cáo Pomodoro Timer', { align: 'center' });
        doc.moveDown();

        // Thông tin tổng quan
        doc.fontSize(14).text('Thống kê tổng quan');
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Tổng số chu kỳ: ${stats.totalCycles}`);
        doc.text(`Tổng thời gian: ${stats.totalHours} giờ`);
        doc.text(`Số ngày hoạt động: ${stats.totalDays}`);
        doc.moveDown();

        // Bảng dữ liệu chi tiết
        const table = {
            headers: ['Ngày', 'Chu kỳ hoàn thành', 'Thời gian (phút)'],
            rows: data.map(row => [
                new Date(row.date).toLocaleDateString(),
                row.completed_cycles.toString(),
                row.total_work_time.toString()
            ])
        };

        await doc.table(table, {
            prepareHeader: () => doc.font('Helvetica-Bold'),
            prepareRow: () => doc.font('Helvetica')
        });

        doc.end();
    } catch (error) {
        console.error('Lỗi khi xuất PDF:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xuất báo cáo' });
    }
});

module.exports = router; 