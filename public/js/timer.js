class PomodoroTimer {
    constructor() {
        // Các element DOM
        this.timerDisplay = document.getElementById('timer');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.currentCycle = document.getElementById('currentCycle');
        this.currentMode = document.getElementById('currentMode');

        // Các biến trạng thái
        this.timeLeft = 25 * 60; // 25 phút mặc định
        this.isRunning = false;
        this.timerId = null;
        this.cycleCount = 1;
        this.mode = 'work'; // 'work', 'shortBreak', 'longBreak'

        // Cài đặt thời gian (sẽ được cập nhật từ settings)
        this.settings = {
            workTime: 25,
            shortBreak: 5,
            longBreak: 15
        };

        // Khởi tạo notification service
        this.notificationService = new NotificationService();
        
        // Kiểm tra và yêu cầu quyền thông báo
        this.initializeNotifications();

        // Khởi tạo sự kiện
        this.initializeEvents();
        
        // Khôi phục trạng thái từ localStorage nếu có
        this.restoreState();

        // Lắng nghe sự thay đổi cài đặt thông báo
        window.addEventListener('notificationSettingChanged', (event) => {
            this.notificationService.toggleNotifications(event.detail.enabled);
        });
    }

    initializeEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());

        // Lưu trạng thái khi người dùng rời trang
        window.addEventListener('beforeunload', () => this.saveState());
    }

    async initializeNotifications() {
        const hasPermission = await NotificationService.checkPermission();
        if (!hasPermission) {
            console.log('Vui lòng cho phép thông báo để nhận được nhắc nhở');
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
        
        // Gửi thông báo phù hợp với mode hiện tại
        if (this.mode === 'work') {
            this.notificationService.sendWorkSessionEnd();
        } else {
            this.notificationService.sendBreakSessionEnd();
        }

        if (this.mode === 'work') {
            if (this.cycleCount % 4 === 0) {
                this.mode = 'longBreak';
                this.timeLeft = this.settings.longBreak * 60;
            } else {
                this.mode = 'shortBreak';
                this.timeLeft = this.settings.shortBreak * 60;
            }
        } else {
            this.mode = 'work';
            this.timeLeft = this.settings.workTime * 60;
            if (this.mode === 'longBreak' || this.mode === 'shortBreak') {
                this.cycleCount++;
            }
        }

        this.updateDisplay();
        this.saveCompletedCycle();
    }

    setTimeForCurrentMode() {
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
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.currentCycle.textContent = this.cycleCount;
        this.currentMode.textContent = this.getModeText();
    }

    getModeText() {
        switch (this.mode) {
            case 'work':
                return 'Làm việc';
            case 'shortBreak':
                return 'Nghỉ ngắn';
            case 'longBreak':
                return 'Nghỉ dài';
            default:
                return '';
        }
    }

    saveState() {
        const state = {
            timeLeft: this.timeLeft,
            isRunning: this.isRunning,
            cycleCount: this.cycleCount,
            mode: this.mode,
            settings: this.settings
        };
        localStorage.setItem('pomodoroState', JSON.stringify(state));
    }

    restoreState() {
        const savedState = localStorage.getItem('pomodoroState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.timeLeft = state.timeLeft;
            this.cycleCount = state.cycleCount;
            this.mode = state.mode;
            this.settings = state.settings;
            this.updateDisplay();
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

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.reset();
    }
}

// Khởi tạo timer khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    const timer = new PomodoroTimer();
    
    // Lắng nghe sự kiện cập nhật cài đặt từ form settings
    window.addEventListener('settingsUpdated', (event) => {
        timer.updateSettings(event.detail);
    });
}); 