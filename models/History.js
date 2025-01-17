const db = require('../config/database');

class History {
    constructor(data) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.date = data.date;
        this.completed_cycles = data.completed_cycles;
        this.total_work_time = data.total_work_time;
    }

    static async findByUserIdAndDate(userId, date) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM history WHERE user_id = ? AND date = ?',
                [userId, date]
            );
            return rows.length ? new History(rows[0]) : null;
        } catch (error) {
            console.error('Lỗi khi tìm lịch sử:', error);
            throw error;
        }
    }

    static async getUserHistory(userId, limit = 7, offset = 0) {
        try {
            const [rows] = await db.execute(
                `SELECT * FROM history 
                WHERE user_id = ? 
                ORDER BY date DESC 
                LIMIT ? OFFSET ?`,
                [userId, limit, offset]
            );
            return rows.map(row => new History(row));
        } catch (error) {
            console.error('Lỗi khi lấy lịch sử:', error);
            throw error;
        }
    }

    static async getHistoryByDateRange(userId, startDate, endDate) {
        try {
            const [rows] = await db.execute(
                `SELECT * FROM history 
                WHERE user_id = ? 
                AND date BETWEEN ? AND ?
                ORDER BY date DESC`,
                [userId, startDate, endDate]
            );
            return rows.map(row => new History(row));
        } catch (error) {
            console.error('Lỗi khi lấy lịch sử theo khoảng thời gian:', error);
            throw error;
        }
    }

    static async addOrUpdateRecord(userId, data) {
        try {
            const existingRecord = await this.findByUserIdAndDate(userId, data.date);

            if (existingRecord) {
                await db.execute(
                    `UPDATE history 
                    SET completed_cycles = completed_cycles + ?,
                        total_work_time = total_work_time + ?
                    WHERE user_id = ? AND date = ?`,
                    [data.completed_cycles, data.total_work_time, userId, data.date]
                );
                return this.findByUserIdAndDate(userId, data.date);
            } else {
                const [result] = await db.execute(
                    `INSERT INTO history (user_id, date, completed_cycles, total_work_time)
                    VALUES (?, ?, ?, ?)`,
                    [userId, data.date, data.completed_cycles, data.total_work_time]
                );
                return this.findByUserIdAndDate(userId, data.date);
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật lịch sử:', error);
            throw error;
        }
    }

    static async getStats(userId) {
        try {
            const [rows] = await db.execute(
                `SELECT 
                    SUM(completed_cycles) as total_cycles,
                    SUM(total_work_time) as total_time,
                    COUNT(DISTINCT date) as total_days
                FROM history 
                WHERE user_id = ?`,
                [userId]
            );
            
            return {
                totalCycles: rows[0].total_cycles || 0,
                totalTime: rows[0].total_time || 0,
                totalDays: rows[0].total_days || 0,
                averageCyclesPerDay: rows[0].total_days ? 
                    (rows[0].total_cycles / rows[0].total_days).toFixed(1) : 0
            };
        } catch (error) {
            console.error('Lỗi khi lấy thống kê:', error);
            throw error;
        }
    }

    static async getTotalRecords(userId) {
        try {
            const [result] = await db.execute(
                'SELECT COUNT(*) as total FROM history WHERE user_id = ?',
                [userId]
            );
            return result[0].total;
        } catch (error) {
            console.error('Lỗi khi đếm số bản ghi:', error);
            throw error;
        }
    }

    static async deleteRecords(userId, startDate, endDate) {
        try {
            await db.execute(
                `DELETE FROM history 
                WHERE user_id = ? 
                AND date BETWEEN ? AND ?`,
                [userId, startDate, endDate]
            );
        } catch (error) {
            console.error('Lỗi khi xóa lịch sử:', error);
            throw error;
        }
    }

    static async exportToCSV(data) {
        const headers = ['Ngày', 'Số chu kỳ hoàn thành', 'Tổng thời gian làm việc (phút)'];
        const rows = data.map(record => [
            record.date,
            record.completed_cycles,
            record.total_work_time
        ]);

        return [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
    }

    static async getDetailedStats(userId) {
        try {
            const [rows] = await db.execute(`
                WITH daily_stats AS (
                    SELECT 
                        DATE(date) as work_date,
                        SUM(completed_cycles) as cycles,
                        SUM(total_work_time) as work_time
                    FROM history 
                    WHERE user_id = ?
                    GROUP BY DATE(date)
                ),
                summary AS (
                    SELECT 
                        SUM(cycles) as total_cycles,
                        SUM(work_time) as total_time,
                        COUNT(*) as total_days,
                        MAX(cycles) as max_cycles,
                        MAX(work_date) as best_day
                    FROM daily_stats
                )
                SELECT * FROM summary
            `, [userId]);

            const stats = rows[0];
            const streaks = await this.calculateStreaksOptimized(userId);

            return {
                totalCycles: stats.total_cycles || 0,
                totalHours: Math.floor((stats.total_time || 0) / 60),
                totalDays: stats.total_days || 0,
                avgCyclesPerDay: stats.total_days ? (stats.total_cycles / stats.total_days).toFixed(1) : 0,
                avgTimePerDay: stats.total_days ? (stats.total_time / stats.total_days).toFixed(0) : 0,
                bestDay: stats.best_day ? new Date(stats.best_day).toLocaleDateString() : 'N/A',
                ...streaks
            };
        } catch (error) {
            console.error('Lỗi khi lấy thống kê chi tiết:', error);
            throw error;
        }
    }

    static async calculateStreaksOptimized(userId) {
        try {
            const [rows] = await db.execute(`
                WITH RECURSIVE dates AS (
                    SELECT 
                        date,
                        @streak := IF(
                            @prev_date IS NULL OR DATEDIFF(date, @prev_date) = 1,
                            @streak + 1,
                            1
                        ) as streak_count,
                        @prev_date := date as prev_date
                    FROM (
                        SELECT DISTINCT date 
                        FROM history 
                        WHERE user_id = ?
                        ORDER BY date DESC
                    ) dates,
                    (SELECT @streak := 0, @prev_date := NULL) vars
                )
                SELECT 
                    MAX(streak_count) as longest_streak,
                    FIRST_VALUE(streak_count) OVER (ORDER BY date DESC) as current_streak
                FROM dates
            `, [userId]);

            return {
                currentStreak: rows[0].current_streak || 0,
                longestStreak: rows[0].longest_streak || 0
            };
        } catch (error) {
            console.error('Lỗi khi tính chuỗi ngày:', error);
            throw error;
        }
    }

    static async getTimeData(userId, range) {
        try {
            let dateFormat, limit;
            switch (range) {
                case 'week':
                    dateFormat = '%Y-%m-%d';
                    limit = 7;
                    break;
                case 'month':
                    dateFormat = '%Y-%m-%d';
                    limit = 30;
                    break;
                case 'year':
                    dateFormat = '%Y-%m';
                    limit = 12;
                    break;
                default:
                    dateFormat = '%Y-%m-%d';
                    limit = 7;
            }

            const [rows] = await db.execute(`
                SELECT 
                    DATE_FORMAT(date, ?) as label,
                    SUM(total_work_time) as value
                FROM history 
                WHERE user_id = ?
                GROUP BY label
                ORDER BY date DESC
                LIMIT ?
            `, [dateFormat, userId, limit]);

            return {
                labels: rows.map(row => row.label),
                values: rows.map(row => row.value)
            };
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu thời gian:', error);
            throw error;
        }
    }

    static async getHeatmapData(userId) {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    UNIX_TIMESTAMP(date) as timestamp,
                    completed_cycles as value
                FROM history 
                WHERE user_id = ?
                AND date >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
            `, [userId]);

            const data = {};
            rows.forEach(row => {
                data[row.timestamp] = row.value;
            });

            return data;
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu heatmap:', error);
            throw error;
        }
    }

    static statsCache = new Map();
    static CACHE_TTL = 5 * 60 * 1000; // 5 phút

    static async getCachedStats(userId) {
        const cacheKey = `stats_${userId}`;
        const cached = this.statsCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
            return cached.data;
        }

        const stats = await this.getDetailedStats(userId);
        this.statsCache.set(cacheKey, {
            data: stats,
            timestamp: Date.now()
        });

        return stats;
    }

    static async createIndexes() {
        try {
            await db.execute(`
                CREATE INDEX IF NOT EXISTS idx_history_user_date ON history(user_id, date);
                CREATE INDEX IF NOT EXISTS idx_history_date ON history(date);
            `);
        } catch (error) {
            console.error('Lỗi khi tạo indexes:', error);
        }
    }
}

module.exports = History; 