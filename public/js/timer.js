class PomodoroTimer {
    constructor() {
        // Khởi tạo các biến mặc định
        this.isRunning = false;
        this.timerId = null;
        this.cycleCount = 1;
        this.mode = 'work';

        // Load settings trước khi khởi tạo bất kỳ thứ gì khác
        this.loadSettings();

        // Sau đó mới khởi tạo DOM elements
        this.initializeDOM();

        // Khởi tạo notification service
        this.notificationService = new NotificationService();
        
        // Khởi tạo sự kiện
        this.initializeEvents();
        
        // Khôi phục trạng thái từ localStorage nếu có
        this.restoreState();

        // Set initial value for long break indicator
        const initialCyclesUntilLongBreak = this.settings.cyclesBeforeLongBreak - (this.cycleCount % this.settings.cyclesBeforeLongBreak);
        this.cyclesUntilLongBreak.textContent = initialCyclesUntilLongBreak;

        // Cập nhật display
        this.updateDisplay();
    }

    initializeDOM() {
        this.timerDisplay = document.getElementById('timer');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.skipBtn = document.getElementById('skipBtn');
        this.cycleDisplay = document.getElementById('cycleDisplay');
        this.stepWork = document.getElementById('stepWork');
        this.stepBreak = document.getElementById('stepBreak');
        this.cyclesUntilLongBreak = document.getElementById('cyclesUntilLongBreak');
        this.longBreakIndicator = document.getElementById('longBreakIndicator');
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        console.log('Loading saved settings:', savedSettings);

        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                this.settings = {
                    workTime: parseInt(settings.workTime) || 25,
                    shortBreak: parseInt(settings.shortBreak) || 5,
                    longBreak: parseInt(settings.longBreak) || 15,
                    totalCycles: parseInt(settings.totalCycles) || 4,
                    cyclesBeforeLongBreak: parseInt(settings.cyclesBeforeLongBreak) || 4
                };
                console.log('Parsed settings:', this.settings);

                // Reset cycleCount if it's greater than totalCycles
                if (this.cycleCount > this.settings.totalCycles) {
                    this.cycleCount = 1;
                }
            } catch (error) {
                console.error('Error loading settings:', error);
                this.setDefaultSettings();
            }
        } else {
            console.log('No saved settings found, using defaults');
            this.setDefaultSettings();
        }

        // Set initial time based on mode
        this.setTimeForCurrentMode();
    }

    setDefaultSettings() {
        this.settings = {
            workTime: 25,
            shortBreak: 5,
            longBreak: 15,
            totalCycles: 4,
            cyclesBeforeLongBreak: 4
        };
    }

    updateSettings(newSettings) {
        this.settings = {
            workTime: parseInt(newSettings.workTime) || 25,
            shortBreak: parseInt(newSettings.shortBreak) || 5,
            longBreak: parseInt(newSettings.longBreak) || 15,
            totalCycles: parseInt(newSettings.totalCycles) || 4,
            cyclesBeforeLongBreak: parseInt(newSettings.cyclesBeforeLongBreak) || 4
        };
        
        // Save all settings to localStorage
        localStorage.setItem('pomodoroSettings', JSON.stringify({
            ...this.settings,
            notifications: newSettings.notifications
        }));
        
        // Update notification settings
        this.notificationService.toggleNotifications(newSettings.notifications);
        
        // Reset cycleCount if it's greater than new totalCycles
        if (this.cycleCount > this.settings.totalCycles) {
            this.cycleCount = 1;
        }
        
        // Reset timer with new settings
        this.reset();
    }

    initializeEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.skipBtn.addEventListener('click', () => this.skipStep());

        // Lưu trạng thái khi người dùng rời trang
        window.addEventListener('beforeunload', () => this.saveState());
    }

    async initializeNotifications() {
        const hasPermission = await NotificationService.checkPermission();
        if (!hasPermission) {
            console.log('Please enable notifications for timer alerts');
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;

            this.timerId = setInterval(() => {
                this.timeLeft--;
                this.updateDisplay();

                if (this.timeLeft <= 0) {
                    this.completeTimer();
                }
            }, 1000);
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            clearInterval(this.timerId);
        }
    }

    reset() {
        this.pause();
        this.setTimeForCurrentMode();
        this.updateDisplay();
    }

    completeTimer() {
        this.pause();
        
        if (this.mode === 'work') {
            this.notificationService.sendBrowserNotification(
                'Break Time!',
                'Time to take a break. Good job!'
            );
            
            // After work, check if it's time for long break
            if (this.cycleCount % this.settings.cyclesBeforeLongBreak === 0) {
                this.mode = 'longBreak';
                this.timeLeft = this.settings.longBreak * 60;
            } else {
                this.mode = 'shortBreak';
                this.timeLeft = this.settings.shortBreak * 60;
            }
        } else {
            this.notificationService.sendBrowserNotification(
                'Work Time!',
                'Break is over. Let\'s get back to work!'
            );
            
            this.mode = 'work';
            this.timeLeft = this.settings.workTime * 60;
            if (this.mode === 'work') {
                this.cycleCount = Math.min(this.cycleCount + 1, this.settings.totalCycles);
            }
        }

        this.updateDisplay();
        this.saveCompletedCycle();
    }

    setTimeForCurrentMode() {
        console.log('Setting time for mode:', this.mode); // Debug log
        console.log('Current settings:', this.settings); // Debug log

        switch (this.mode) {
            case 'work':
                this.timeLeft = this.settings.workTime * 60;
                break;
            case 'shortBreak':
                this.timeLeft = this.settings.shortBreak * 60;
                break;
            case 'longBreak':
                this.timeLeft = this.settings.longBreak * 60;
                break;
        }
        console.log('Set timeLeft to:', this.timeLeft); // Debug log
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.cycleDisplay.textContent = `${this.cycleCount}/${this.settings.totalCycles}`;

        // Update cycle steps
        this.stepWork.classList.remove('active');
        this.stepBreak.classList.remove('active', 'break');

        if (this.mode === 'work') {
            this.stepWork.classList.add('active');
        } else {
            this.stepBreak.classList.add('active', 'break');
        }

        // Update cycles until long break
        const cyclesRemaining = this.settings.cyclesBeforeLongBreak - (this.cycleCount % this.settings.cyclesBeforeLongBreak);
        this.cyclesUntilLongBreak.textContent = cyclesRemaining;
        
        if (cyclesRemaining === 0) {
            this.longBreakIndicator.textContent = "Long Break next!";
            this.longBreakIndicator.style.color = '#6c63ff';
        } else {
            this.longBreakIndicator.textContent = `${cyclesRemaining} until Long Break`;
            this.longBreakIndicator.style.color = '';
        }
    }

    getModeText() {
        switch (this.mode) {
            case 'work':
                return 'Work';
            case 'shortBreak':
                return 'Short Break';
            case 'longBreak':
                return 'Long Break';
            default:
                return '';
        }
    }

    saveState() {
        const state = {
            timeLeft: this.timeLeft,
            isRunning: this.isRunning,
            cycleCount: this.cycleCount,
            mode: this.mode
        };
        localStorage.setItem('pomodoroState', JSON.stringify(state));
    }

    restoreState() {
        const savedState = localStorage.getItem('pomodoroState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.mode = state.mode;
            
            // Ensure cycleCount doesn't exceed totalCycles from settings
            this.cycleCount = Math.min(state.cycleCount, this.settings.totalCycles);
            
            // Load time from state or set based on mode
            if (state.timeLeft) {
                this.timeLeft = state.timeLeft;
            } else {
                this.setTimeForCurrentMode();
            }
            
            this.updateDisplay();
        } else {
            // If no state, set time based on current mode
            this.setTimeForCurrentMode();
        }
    }

    async saveCompletedCycle() {
        if (this.mode === 'work') {
            try {
                const response = await fetch('/api/history/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        completedCycles: 1,
                        totalWorkTime: this.settings.workTime
                    })
                });

                if (!response.ok) {
                    console.error('Lỗi khi lưu chu kỳ hoàn thành');
                }
            } catch (error) {
                console.error('Lỗi kết nối:', error);
            }
        }
    }

    skipStep() {
        this.completeTimer();
    }
}

// Khởi tạo timer khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    window.pomodoroTimer = new PomodoroTimer();
    
    // Request notification permission
    if ('Notification' in window) {
        Notification.requestPermission();
    }
    
    console.log('Timer initialized with settings:', window.pomodoroTimer.settings);
}); 