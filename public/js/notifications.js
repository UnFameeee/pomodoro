class NotificationService {
    constructor() {
        this.isEnabled = true;
        this.sound = new Audio('/sounds/notification.mp3');
    }

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

    toggleNotifications(enabled) {
        this.isEnabled = enabled;
    }

    sendBrowserNotification(title, message) {
        if (!this.isEnabled) return;

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/images/tomato.png'
            });

            // Play sound if enabled
            if (this.sound) {
                this.sound.play().catch(err => console.log('Error playing sound:', err));
            }
        }
    }
} 