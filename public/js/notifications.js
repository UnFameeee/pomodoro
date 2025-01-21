class NotificationService {
    constructor() {
        this.isEnabled = this.loadNotificationSetting();
        this.sound = new Audio('/sounds/notification.mp3');
    }

    loadNotificationSetting() {
        const settings = localStorage.getItem('pomodoroSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            return parsed.notifications !== false; // Explicit check for false
        }
        return true; // Default to true if no settings found
    }

    toggleNotifications(enabled) {
        this.isEnabled = enabled;
    }

    async sendBrowserNotification(title, body) {
        // Check if notifications are enabled in settings
        if (!this.isEnabled) {
            return;
        }

        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification(title, {
                    body: body,
                    icon: '/images/favicon.ico'
                });

                // Play sound if enabled
                if (this.sound) {
                    this.sound.play().catch(err => console.log('Error playing sound:', err));
                }
            }
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    static async checkPermission() {
        if (!('Notification' in window)) {
            return false;
        }
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
} 