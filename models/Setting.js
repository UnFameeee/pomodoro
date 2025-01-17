const db = require('../config/database');

class Setting {
    constructor(data) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.work_time = data.work_time;
        this.short_break = data.short_break;
        this.long_break = data.long_break;
    }

    static async findByUserId(userId) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM settings WHERE user_id = ?',
                [userId]
            );
            return rows.length ? new Setting(rows[0]) : null;
        } catch (error) {
            console.error('Lỗi khi tìm cài đặt:', error);
            throw error;
        }
    }

    static async createOrUpdate(userId, data) {
        try {
            const [existing] = await db.execute(
                'SELECT * FROM settings WHERE user_id = ?',
                [userId]
            );

            if (existing.length) {
                await db.execute(
                    `UPDATE settings 
                    SET work_time = ?, short_break = ?, long_break = ?
                    WHERE user_id = ?`,
                    [data.work_time, data.short_break, data.long_break, userId]
                );
                return this.findByUserId(userId);
            } else {
                const [result] = await db.execute(
                    `INSERT INTO settings (user_id, work_time, short_break, long_break)
                    VALUES (?, ?, ?, ?)`,
                    [userId, data.work_time, data.short_break, data.long_break]
                );
                return this.findByUserId(userId);
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật cài đặt:', error);
            throw error;
        }
    }

    static async getDefaultSettings() {
        return {
            work_time: 25,
            short_break: 5,
            long_break: 15
        };
    }
}

module.exports = Setting; 