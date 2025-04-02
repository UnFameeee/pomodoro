class PomodoroTimer {
    constructor() {
        // Khởi tạo các biến mặc định
        this.isRunning = false;
        this.timerId = null;
        this.cycleCount = 1;
        this.mode = 'work';
        this.timeLeft = 0; // Initialize timeLeft to 0 to force update

        console.log('Initializing Pomodoro Timer');

        // Load settings trước khi khởi tạo bất kỳ thứ gì khác
        this.loadSettings();

        // Sau đó mới khởi tạo DOM elements
        this.initializeDOM();

        // Khởi tạo notification service
        this.notificationService = new NotificationService();

        // Khôi phục trạng thái từ localStorage nếu có
        this.restoreState();

        // Nếu không có trạng thái được khôi phục, hãy thiết lập thời gian cho chế độ hiện tại
        if (this.timeLeft <= 0) {
            this.setTimeForCurrentMode();
            console.log('Setting initial time for mode:', this.mode, 'to', this.timeLeft);
        }

        // Khởi tạo sự kiện
        this.initializeEvents();

        // Đảm bảo sử dụng settings mới nhất từ localStorage
        this.forceResetTimer();

        // Set initial value for long break indicator
        const initialCyclesUntilLongBreak = this.settings.cyclesBeforeLongBreak - (this.cycleCount % this.settings.cyclesBeforeLongBreak);
        if (this.cyclesUntilLongBreak) {
            this.cyclesUntilLongBreak.textContent = initialCyclesUntilLongBreak;
        }

        // Cập nhật display
        this.updateDisplay();

        this.completedCyclesDisplay = document.getElementById('completedCycles');
        this.loadCompletedCycles(); // Load completed cycles from storage
        
        // Show debug information
        this.updateSettingsDebug();
        
        console.log('Timer fully initialized with mode:', this.mode, 'and timeLeft:', this.timeLeft);
    }

    initializeDOM() {
        this.timerDisplay = document.getElementById('timer');
        this.startPauseBtn = document.getElementById('startPauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.skipBtn = document.getElementById('skipBtn');
        this.skipBtn.disabled = true;
        this.cycleDisplay = document.getElementById('cycleDisplay');
        this.stepWork = document.getElementById('stepWork');
        this.stepBreak = document.getElementById('stepBreak');
        this.cyclesUntilLongBreak = document.getElementById('cyclesUntilLongBreak');
        this.longBreakIndicator = document.getElementById('longBreakIndicator');
        this.settingsDebug = document.getElementById('settingsDebug');
        
        // Thêm sự kiện double-click vào timer display để buộc làm mới timer với settings mới
        if (this.timerDisplay) {
            this.timerDisplay.addEventListener('dblclick', () => {
                this.forceResetTimer();
                if (typeof Toast !== 'undefined') {
                    Toast.show('Timer reset with latest settings', 'info');
                }
            });
        }
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        console.log('Loading saved settings:', savedSettings);

        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                
                // Đảm bảo các giá trị đều là số nguyên hợp lệ
                this.settings = {
                    workTime: Math.max(1, parseInt(settings.workTime) || 25),
                    shortBreak: Math.max(1, parseInt(settings.shortBreak) || 5),
                    longBreak: Math.max(1, parseInt(settings.longBreak) || 15),
                    totalCycles: Math.max(1, parseInt(settings.totalCycles) || 4),
                    cyclesBeforeLongBreak: Math.max(1, parseInt(settings.cyclesBeforeLongBreak) || 4),
                    notifications: settings.notifications
                };
                console.log('Parsed settings:', this.settings);

                // Reset cycleCount if it's greater than totalCycles
                if (this.cycleCount > this.settings.totalCycles) {
                    this.cycleCount = 1;
                }
                
                // Lưu lại settings đã được normalize
                localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
            } catch (error) {
                console.error('Error loading settings, using defaults:', error);
                this.setDefaultSettings();
                // Lưu lại default settings
                localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
                
                // Hiển thị thông báo lỗi nếu chúng ta có Toast
                if (typeof Toast !== 'undefined') {
                    Toast.show('Error loading settings. Using defaults.', 'error');
                }
            }
        } else {
            console.log('No saved settings found, using defaults');
            this.setDefaultSettings();
            // Lưu default settings vào localStorage
            localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
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
            cyclesBeforeLongBreak: 4,
            notifications: true
        };
    }

    updateSettings(newSettings) {
        console.log('Updating timer settings with:', newSettings);
        
        // Trước khi cập nhật settings, lưu lại mode và cycle hiện tại
        const currentMode = this.mode;
        const currentCycle = this.cycleCount;
        
        // Đảm bảo tất cả các giá trị đều được phân tích đúng thành số nguyên
        this.settings = {
            workTime: Math.max(1, parseInt(newSettings.workTime) || 25),
            shortBreak: Math.max(1, parseInt(newSettings.shortBreak) || 5),
            longBreak: Math.max(1, parseInt(newSettings.longBreak) || 15),
            totalCycles: Math.max(1, parseInt(newSettings.totalCycles) || 4),
            cyclesBeforeLongBreak: Math.max(1, parseInt(newSettings.cyclesBeforeLongBreak) || 4),
            notifications: newSettings.notifications !== false
        };

        // Save all settings to localStorage
        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
        console.log('Saved updated settings to localStorage:', this.settings);

        // Update notification settings if notification service exists
        if (this.notificationService && typeof this.notificationService.toggleNotifications === 'function') {
            this.notificationService.toggleNotifications(this.settings.notifications);
        }

        // Reset cycleCount if it's greater than new totalCycles
        if (this.cycleCount > this.settings.totalCycles) {
            this.cycleCount = 1;
        } else {
            // Khôi phục cycle hiện tại
            this.cycleCount = currentCycle;
        }
        
        // Khôi phục mode hiện tại
        this.mode = currentMode;

        // Update long break indicator if it exists
        if (this.longBreakIndicator && this.cyclesUntilLongBreak) {
            const cyclesRemaining = this.settings.cyclesBeforeLongBreak - (this.cycleCount % this.settings.cyclesBeforeLongBreak);
            this.cyclesUntilLongBreak.textContent = cyclesRemaining;
        }

        // Reset the timer with updated settings
        this.pause();  // Make sure timer is paused
        this.setTimeForCurrentMode();  // Set the correct time based on current mode
        this.updateDisplay();  // Update the UI
        
        // Update debug display
        this.updateSettingsDebug();
        
        console.log('Timer settings updated, new settings:', this.settings);
        console.log('Current mode:', this.mode, 'Current cycle:', this.cycleCount, 'Current time:', this.timeLeft);
    }

    initializeEvents() {
        this.startPauseBtn.addEventListener('click', () => this.toggleStartPause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.skipBtn.addEventListener('click', () => this.skipStep());

        // Lưu trạng thái khi người dùng rời trang
        window.addEventListener('beforeunload', () => this.saveState());
        
        // Lắng nghe sự kiện storage thay đổi để tự động cập nhật timer
        window.addEventListener('storage', (event) => {
            if (event.key === 'pomodoroSettings') {
                console.log('Settings changed in another tab/window, auto-updating timer...');
                this.forceResetTimer();
                if (typeof Toast !== 'undefined') {
                    Toast.show('Timer updated with new settings', 'info');
                }
            }
        });
    }

    async initializeNotifications() {
        const hasPermission = await NotificationService.checkPermission();
        if (!hasPermission) {
            console.log('Please enable notifications for timer alerts');
        }
    }

    toggleStartPause() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startPauseBtn.classList.remove('btn-primary');
            this.startPauseBtn.classList.add('btn-warning');
            this.startPauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
            this.skipBtn.disabled = false;

            // Store the start timestamp and current timeLeft value
            this.startTime = Date.now();
            this.initialTimeLeft = this.timeLeft;

            this.timerId = setInterval(() => {
                // Calculate elapsed time in seconds since timer started
                const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
                // Calculate new timeLeft based on initial value and elapsed time
                this.timeLeft = this.initialTimeLeft - elapsedSeconds;
                this.updateDisplay();

                if (this.timeLeft <= 0) {
                    this.completeTimer();
                }
            }, 100); // Update more frequently for smoother display
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            this.startPauseBtn.classList.remove('btn-warning');
            this.startPauseBtn.classList.add('btn-primary');
            this.startPauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
            this.skipBtn.disabled = true;
            clearInterval(this.timerId);
            // Store the actual timeLeft when paused
            this.initialTimeLeft = this.timeLeft;
        }
    }

    reset() {
        this.pause();
        this.setTimeForCurrentMode();
        this.updateDisplay();
        this.skipBtn.disabled = true;
    }

    completeTimer() {
        this.pause();

        if (this.mode === 'work') {
            this.notificationService.sendBrowserNotification(
                'Break Time!',
                'Time to take a break. Good job!'
            );

            // After work, check if it's time for long break
            if (this.cycleCount % this.settings.cyclesBeforeLongBreak == 0) {
                this.mode = 'longBreak';
                this.timeLeft = parseInt(this.settings.longBreak) * 60;
            } else {
                this.mode = 'shortBreak';
                this.timeLeft = parseInt(this.settings.shortBreak) * 60;
            }
        } else {
            // Check if this was the last break of the last cycle
            if (this.cycleCount >= this.settings.totalCycles) {
                this.notificationService.sendBrowserNotification(
                    'All Cycles Completed!',
                    'Great job! Take a longer break before starting again.'
                );
                
                // Show toast notification with emoji
                Toast.show('🎉 Congratulations! You\'ve completed all cycles for today!', 'success');
                
                // Reset everything for a new set of cycles
                this.cycleCount = 1;
                this.mode = 'work';
                this.timeLeft = parseInt(this.settings.workTime) * 60;
            } else {
                this.notificationService.sendBrowserNotification(
                    'Work Time!',
                    'Break is over. Let\'s get back to work!'
                );

                this.mode = 'work';
                this.timeLeft = parseInt(this.settings.workTime) * 60;

                // Increment completed cycles when starting a new work session
                if (this.cycleCount < this.settings.totalCycles) {
                    this.cycleCount++;
                    this.completedCycles++;
                    this.updateCompletedCyclesDisplay();
                    this.saveCompletedCycles();
                }
            }
        }

        this.updateDisplay();
        this.saveCompletedCycle();
    }

    setTimeForCurrentMode() {
        // Reload settings to make sure we have the latest values
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            try {
                // Re-parse settings to get the most up-to-date values
                const freshSettings = JSON.parse(savedSettings);
                
                // Update our settings object with the latest values from localStorage
                this.settings = {
                    workTime: Math.max(1, parseInt(freshSettings.workTime) || 25),
                    shortBreak: Math.max(1, parseInt(freshSettings.shortBreak) || 5),
                    longBreak: Math.max(1, parseInt(freshSettings.longBreak) || 15),
                    totalCycles: Math.max(1, parseInt(freshSettings.totalCycles) || 4),
                    cyclesBeforeLongBreak: Math.max(1, parseInt(freshSettings.cyclesBeforeLongBreak) || 4),
                    notifications: freshSettings.notifications !== false
                };
            } catch (error) {
                console.error('Error reloading settings in setTimeForCurrentMode, using current settings:', error);
                // Continue with existing settings
            }
        }
    
        console.log('Setting time for mode:', this.mode); 
        console.log('Using settings:', this.settings); 

        let minutes = 25; // Default fallback

        switch (this.mode) {
            case 'work':
                minutes = parseInt(this.settings.workTime);
                console.log('Setting work time to:', minutes);
                break;
            case 'shortBreak':
                minutes = parseInt(this.settings.shortBreak);
                console.log('Setting short break time to:', minutes);
                break;
            case 'longBreak':
                minutes = parseInt(this.settings.longBreak);
                console.log('Setting long break time to:', minutes);
                break;
            default:
                console.error('Unknown mode:', this.mode, 'defaulting to 25 minutes');
                break;
        }

        // Make sure minutes is a valid number and at least 1
        minutes = isNaN(minutes) || minutes < 1 ? 25 : minutes;
        
        // Convert minutes to seconds
        this.timeLeft = minutes * 60;
        console.log('Final timeLeft set to:', this.timeLeft, 'seconds (', minutes, 'minutes)');
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        this.cycleDisplay.textContent = `${this.cycleCount}/${this.settings.totalCycles}`;

        // Update cycle steps
        this.stepWork.classList.remove('active');
        this.stepBreak.classList.remove('active', 'break');

        // Hide long break indicator if totalCycles is less than cyclesBeforeLongBreak
        if (this.settings.totalCycles < this.settings.cyclesBeforeLongBreak) {
            this.longBreakIndicator.style.display = 'none';
        } else {
            this.longBreakIndicator.style.display = 'flex';
            // Update cycles until long break
            const cyclesRemaining = this.settings.cyclesBeforeLongBreak - (this.cycleCount % this.settings.cyclesBeforeLongBreak);
            this.cyclesUntilLongBreak.textContent = cyclesRemaining;

            if (cyclesRemaining === 0) {
                this.longBreakIndicator.textContent = "Long Break next!";
                this.longBreakIndicator.classList.add('next');
            } else {
                this.longBreakIndicator.textContent = `${cyclesRemaining} to Long Break`;
                this.longBreakIndicator.classList.remove('next');
            }
        }

        if (this.mode === 'work') {
            this.stepWork.classList.add('active');
            // Reset break text
            if (this.cycleCount % this.settings.cyclesBeforeLongBreak === 0) {
                this.stepBreak.textContent = 'Long Break';
            } else {
                this.stepBreak.textContent = 'Short Break';
            }
        } else {
            this.stepBreak.classList.add('active', 'break');
            // Update break text based on mode
            if (this.mode === 'longBreak') {
                this.stepBreak.textContent = 'Long Break';
            } else if (this.mode === 'shortBreak') {
                // Check if next break will be long break
                if (this.cycleCount % this.settings.cyclesBeforeLongBreak === 0) {
                    this.stepBreak.textContent = 'Long Break';
                } else {
                    this.stepBreak.textContent = 'Short Break';
                }
            }
        }
        
        // Update debug display
        this.updateSettingsDebug();
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

    clearSettings() {
        // Remove all saved settings and state
        localStorage.removeItem('pomodoroSettings');
        localStorage.removeItem('pomodoroState');
        
        // Reset to default settings
        this.setDefaultSettings();
        
        // Reset timer state
        this.mode = 'work';
        this.cycleCount = 1;
        this.setTimeForCurrentMode();
        this.updateDisplay();
        
        console.log('All settings and state cleared, using defaults');
        
        if (typeof Toast !== 'undefined') {
            Toast.show('Settings reset to defaults', 'info');
        }
        
        return this.settings;
    }

    forceResetTimer() {
        // Dùng để làm mới hoàn toàn timer với settings mới nhất từ localStorage
        console.log('Forcing timer reset with latest settings');
        
        // Re-read settings from localStorage
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                this.settings = {
                    workTime: Math.max(1, parseInt(settings.workTime) || 25),
                    shortBreak: Math.max(1, parseInt(settings.shortBreak) || 5),
                    longBreak: Math.max(1, parseInt(settings.longBreak) || 15),
                    totalCycles: Math.max(1, parseInt(settings.totalCycles) || 4),
                    cyclesBeforeLongBreak: Math.max(1, parseInt(settings.cyclesBeforeLongBreak) || 4),
                    notifications: settings.notifications !== false
                };
                console.log('Successfully reloaded settings from localStorage:', this.settings);
            } catch (error) {
                console.error('Error reloading settings, keeping current settings:', error);
            }
        }
        
        // Pause timer if running
        if (this.isRunning) {
            this.pause();
        }
        
        // Reset the time based on current mode
        this.setTimeForCurrentMode();
        
        // Update display
        this.updateDisplay();
        
        console.log('Timer force reset complete. Mode:', this.mode, 'Time:', this.timeLeft);
        
        return true;
    }

    restoreState() {
        const savedState = localStorage.getItem('pomodoroState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                this.mode = state.mode || 'work';

                // Ensure cycleCount doesn't exceed totalCycles from settings
                this.cycleCount = Math.min(parseInt(state.cycleCount) || 1, this.settings.totalCycles);

                // Load time from state or set based on mode
                if (state.timeLeft && parseInt(state.timeLeft) > 0) {
                    this.timeLeft = parseInt(state.timeLeft);
                    console.log('Restored timeLeft from state:', this.timeLeft);
                } else {
                    this.setTimeForCurrentMode();
                    console.log('Setting new time for mode because no valid timeLeft in state');
                }

                // If the timer was running, auto-start it
                if (state.isRunning) {
                    // We delay the start slightly to ensure UI is ready
                    setTimeout(() => this.start(), 500);
                }

                this.updateDisplay();
            } catch (error) {
                console.error('Error parsing saved state, resetting:', error);
                this.setTimeForCurrentMode();
                this.updateDisplay();
            }
        } else {
            // If no state, set time based on current mode
            this.setTimeForCurrentMode();
        }
    }

    async saveCompletedCycle() {
        // if (this.mode === 'work') {
        //     try {
        //         const response = await fetch('/api/history/save', {
        //             method: 'POST',
        //             headers: {
        //                 'Content-Type': 'application/json'
        //             },
        //             body: JSON.stringify({
        //                 completedCycles: 1,
        //                 totalWorkTime: this.settings.workTime
        //             })
        //         });

        //         if (!response.ok) {
        //             console.error('Lỗi khi lưu chu kỳ hoàn thành');
        //         }
        //     } catch (error) {
        //         console.error('Lỗi kết nối:', error);
        //     }
        // }
    }

    skipStep() {
        this.completeTimer();
    }

    loadCompletedCycles() {
        // Load completed cycles from localStorage
        const today = new Date().toLocaleDateString();
        const savedStats = localStorage.getItem('pomodoroStats');
        if (savedStats) {
            const stats = JSON.parse(savedStats);
            if (stats.lastUpdate === today) {
                this.completedCycles = stats.completedCycles || 0;
            } else {
                // Reset for new day
                this.completedCycles = 0;
                this.saveCompletedCycles();
            }
        } else {
            this.completedCycles = 0;
        }
        this.updateCompletedCyclesDisplay();
    }

    updateCompletedCyclesDisplay() {
        if (this.completedCyclesDisplay) {
            this.completedCyclesDisplay.textContent = this.completedCycles;
        }
    }

    saveCompletedCycles() {
        const today = new Date().toLocaleDateString();
        localStorage.setItem('pomodoroStats', JSON.stringify({
            lastUpdate: today,
            completedCycles: this.completedCycles
        }));
    }

    updateSettingsDebug() {
        // Update the settings debug element if it exists
        if (this.settingsDebug) {
            const debug = {
                settings: this.settings,
                currentMode: this.mode,
                currentCycle: this.cycleCount,
                timeLeft: {
                    minutes: Math.floor(this.timeLeft / 60),
                    seconds: this.timeLeft % 60,
                    total: this.timeLeft
                },
                isRunning: this.isRunning
            };
            
            this.settingsDebug.textContent = JSON.stringify(debug, null, 2);
        }
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