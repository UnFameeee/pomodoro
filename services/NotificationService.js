const notifier = require('node-notifier');
const path = require('path');

class NotificationService {
    constructor() {
        this.iconPath = path.join(__dirname, '../public/images/tomato.png');
        this.isEnabled = true;
        
        // Khởi tạo âm thanh thông báo
        this.sound = new Audio('/sounds/notification.mp3');
        this.soundEnabled = true;
    }

    // Kiểm tra quyền thông báo trên browser
    static async checkPermission() {
        if (!('Notification' in window)) {
            return false;
        }
        
        if (Notification.permission === 'granted') {
            return true;
        }
        
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        
        return false;
    }

    // Gửi thông báo trên browser
    sendBrowserNotification(title, message) {
        if (!this.isEnabled) return;

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: this.iconPath,
                silent: false
            });
        }
    }

    // Gửi thông báo desktop
    sendDesktopNotification(title, message) {
        if (!this.isEnabled) return;

        notifier.notify({
            title: title,
            message: message,
            icon: this.iconPath,
            sound: true,
            wait: true
        });
    }

    // Gửi thông báo kết thúc phiên làm việc
    sendWorkSessionEnd() {
        const title = 'Pomodoro Timer';
        const message = 'Đã đến giờ nghỉ ngơi! Hãy thư giãn một chút.';
        
        this.sendBrowserNotification(title, message);
        this.sendDesktopNotification(title, message);
        this.playSound();
    }

    // Gửi thông báo kết thúc giờ nghỉ
    sendBreakSessionEnd() {
        const title = 'Pomodoro Timer';
        const message = 'Đã đến lúc quay lại làm việc!';
        
        this.sendBrowserNotification(title, message);
        this.sendDesktopNotification(title, message);
        this.playSound();
    }

    // Bật/tắt thông báo
    toggleNotifications(enabled) {
        this.isEnabled = enabled;
    }

    playSound() {
        if (this.soundEnabled && this.isEnabled) {
            this.sound.play().catch(error => {
                console.log('Không thể phát âm thanh:', error);
            });
        }
    }

    // Thêm phương thức điều khiển âm thanh
    toggleSound(enabled) {
        this.soundEnabled = enabled;
    }
}

module.exports = NotificationService; 