class SettingsTimer {
    constructor() {
        // Khởi tạo notification service
        this.notificationService = new NotificationService();
        
        // Load settings
        this.loadSettings();
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                this.settings = {
                    workTime: parseInt(settings.workTime) || 25,
                    shortBreak: parseInt(settings.shortBreak) || 5,
                    longBreak: parseInt(settings.longBreak) || 15
                };
                
                if (this.notificationService) {
                    this.notificationService.toggleNotifications(settings.notifications);
                }
            } catch (error) {
                console.error('Error parsing settings:', error);
                this.setDefaultSettings();
            }
        } else {
            this.setDefaultSettings();
        }
    }

    setDefaultSettings() {
        this.settings = {
            workTime: 25,
            shortBreak: 5,
            longBreak: 15
        };
    }

    updateSettings(newSettings) {
        this.settings = {
            workTime: parseInt(newSettings.workTime) || 25,
            shortBreak: parseInt(newSettings.shortBreak) || 5,
            longBreak: parseInt(newSettings.longBreak) || 15
        };
        
        localStorage.setItem('pomodoroSettings', JSON.stringify({
            ...this.settings,
            notifications: newSettings.notifications
        }));
        
        this.notificationService.toggleNotifications(newSettings.notifications);
    }
} 