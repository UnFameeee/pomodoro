const db = require('../config/database');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.email = data.email;
        this.password = data.password;
        this.created_at = data.created_at;
    }

    static async findById(id) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE id = ?',
                [id]
            );
            return rows.length ? new User(rows[0]) : null;
        } catch (error) {
            console.error('Lỗi khi tìm user:', error);
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return rows.length ? new User(rows[0]) : null;
        } catch (error) {
            console.error('Lỗi khi tìm user:', error);
            throw error;
        }
    }

    static async create(userData) {
        try {
            const [result] = await db.execute(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [userData.username, userData.email, userData.password]
            );
            return this.findById(result.insertId);
        } catch (error) {
            console.error('Lỗi khi tạo user:', error);
            throw error;
        }
    }

    async update(data) {
        try {
            await db.execute(
                'UPDATE users SET username = ?, email = ? WHERE id = ?',
                [data.username, data.email, this.id]
            );
            Object.assign(this, data);
            return this;
        } catch (error) {
            console.error('Lỗi khi cập nhật user:', error);
            throw error;
        }
    }

    static async update(id, data) {
        try {
            const fields = [];
            const values = [];
            
            Object.entries(data).forEach(([key, value]) => {
                fields.push(`${key} = ?`);
                values.push(value);
            });
            
            values.push(id);
            
            await db.execute(
                `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
            
            return this.findById(id);
        } catch (error) {
            console.error('Lỗi khi cập nhật người dùng:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            // Xóa tất cả dữ liệu liên quan
            await db.execute('DELETE FROM history WHERE user_id = ?', [id]);
            await db.execute('DELETE FROM settings WHERE user_id = ?', [id]);
            await db.execute('DELETE FROM users WHERE id = ?', [id]);
        } catch (error) {
            console.error('Lỗi khi xóa người dùng:', error);
            throw error;
        }
    }

    async enable2FA() {
        const secret = speakeasy.generateSecret({
            name: `PomodoroApp:${this.email}`
        });
        
        // Lưu secret tạm thời
        this.temp2FASecret = secret.base32;
        await db.execute(
            'UPDATE users SET temp_2fa_secret = ? WHERE id = ?',
            [this.temp2FASecret, this.id]
        );
        
        // Tạo QR code
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);
        return { secret: secret.base32, qrCode };
    }

    async verify2FA(token) {
        const verified = speakeasy.totp.verify({
            secret: this.temp2FASecret,
            encoding: 'base32',
            token: token
        });
        
        if (verified) {
            // Kích hoạt 2FA
            await db.execute(
                'UPDATE users SET is_2fa_enabled = 1, two_factor_secret = ? WHERE id = ?',
                [this.temp2FASecret, this.id]
            );
            return true;
        }
        return false;
    }

    async verify2FALogin(token) {
        return speakeasy.totp.verify({
            secret: this.two_factor_secret,
            encoding: 'base32',
            token: token
        });
    }

    async incrementLoginAttempts() {
        try {
            const [result] = await db.execute(
                `UPDATE users 
                SET login_attempts = login_attempts + 1,
                    last_login_attempt = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [this.id]
            );
            
            if (this.login_attempts >= 5) {
                await db.execute(
                    'UPDATE users SET is_locked = 1 WHERE id = ?',
                    [this.id]
                );
                return true; // Tài khoản bị khóa
            }
            return false;
        } catch (error) {
            console.error('Lỗi khi cập nhật số lần đăng nhập:', error);
            throw error;
        }
    }

    async resetLoginAttempts() {
        try {
            await db.execute(
                'UPDATE users SET login_attempts = 0, is_locked = 0 WHERE id = ?',
                [this.id]
            );
        } catch (error) {
            console.error('Lỗi khi reset số lần đăng nhập:', error);
            throw error;
        }
    }
}

module.exports = User; 