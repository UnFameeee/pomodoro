class SettingsTimer {
    constructor() {
        this.initializeSettingsPage();
    }

    initializeSettingsPage() {
        // Load saved settings
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                console.log(settings.totalCycles);
                document.getElementById('workTime').value = settings.workTime || 25;
                document.getElementById('shortBreak').value = settings.shortBreak || 5;
                document.getElementById('longBreak').value = settings.longBreak || 15;
                document.getElementById('totalCycles').value = settings.totalCycles || 4;
                document.getElementById('cyclesBeforeLongBreak').value = settings.cyclesBeforeLongBreak || 4;
                document.getElementById('notifications').checked = settings.notifications !== false;
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        }

        // Add click event listener for save button
        const saveButton = document.getElementById('saveButton');   
        saveButton.onclick = this.handleSaveSettings.bind(this);
        
        // Add click event listener for reset button
        const resetButton = document.getElementById('resetButton');
        if (resetButton) {
            resetButton.onclick = this.handleResetSettings.bind(this);
        }
    }

    handleSaveSettings() {
        const formData = {
            workTime: parseInt(document.getElementById('workTime').value) || 25,
            shortBreak: parseInt(document.getElementById('shortBreak').value) || 5,
            longBreak: parseInt(document.getElementById('longBreak').value) || 15,
            totalCycles: parseInt(document.getElementById('totalCycles').value) || 4,
            cyclesBeforeLongBreak: parseInt(document.getElementById('cyclesBeforeLongBreak').value) || 4,
            notifications: document.getElementById('notifications').checked
        };
        
        try {
            // Validate input
            if (formData.workTime < 1 || formData.shortBreak < 1 || formData.longBreak < 1 || 
                formData.totalCycles < 1 || formData.cyclesBeforeLongBreak < 1) {
                alert('All durations and cycles must be at least 1');
                return;
            }

            // Backup current settings to compare later
            const oldSettings = localStorage.getItem('pomodoroSettings');
            
            // Save to localStorage with all settings
            localStorage.setItem('pomodoroSettings', JSON.stringify(formData));
            
            // Update timer if it exists on this page
            if (window.pomodoroTimer) {
                window.pomodoroTimer.updateSettings(formData);
            } else {
                // Kích hoạt sự kiện storage một cách thủ công để các tab khác biết có thay đổi
                try {
                    // Tạo một sự kiện storage mới
                    const storageEvent = new StorageEvent('storage', {
                        key: 'pomodoroSettings',
                        newValue: JSON.stringify(formData),
                        oldValue: oldSettings,
                        url: window.location.href,
                        storageArea: localStorage
                    });
                    
                    // Kích hoạt sự kiện cho window hiện tại
                    window.dispatchEvent(storageEvent);
                    
                    console.log('Manual storage event dispatched');
                } catch (e) {
                    console.error('Could not dispatch manual storage event:', e);
                }
            }

            // Show success feedback
            const saveBtn = document.getElementById('saveButton');
            const originalContent = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
            saveBtn.disabled = true;
            
            setTimeout(() => {
                saveBtn.innerHTML = originalContent;
                saveBtn.disabled = false;
            }, 2000);

            // Thêm notification thành công
            if (typeof Toast !== 'undefined') {
                Toast.show('Settings saved and applied successfully!', 'success');
            }

        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings');
        }
    }

    handleResetSettings() {
        // Hiển thị hộp thoại xác nhận
        if (confirm('Are you sure you want to reset all settings to default values?')) {
            // Reset về giá trị mặc định
            const defaultSettings = {
                workTime: 25,
                shortBreak: 5,
                longBreak: 15,
                totalCycles: 4,
                cyclesBeforeLongBreak: 4,
                notifications: true
            };
            
            // Cập nhật các trường input
            document.getElementById('workTime').value = defaultSettings.workTime;
            document.getElementById('shortBreak').value = defaultSettings.shortBreak;
            document.getElementById('longBreak').value = defaultSettings.longBreak;
            document.getElementById('totalCycles').value = defaultSettings.totalCycles;
            document.getElementById('cyclesBeforeLongBreak').value = defaultSettings.cyclesBeforeLongBreak;
            document.getElementById('notifications').checked = defaultSettings.notifications;
            
            // Backup settings hiện tại
            const oldSettings = localStorage.getItem('pomodoroSettings');
            
            // Xóa settings khỏi localStorage
            localStorage.removeItem('pomodoroSettings');
            localStorage.removeItem('pomodoroState');
            
            // Lưu lại settings mặc định
            localStorage.setItem('pomodoroSettings', JSON.stringify(defaultSettings));
            
            // Nếu timer đang tồn tại ở trang này, cập nhật nó
            if (window.pomodoroTimer) {
                window.pomodoroTimer.updateSettings(defaultSettings);
            } else {
                // Kích hoạt sự kiện storage thủ công
                try {
                    const storageEvent = new StorageEvent('storage', {
                        key: 'pomodoroSettings',
                        newValue: JSON.stringify(defaultSettings),
                        oldValue: oldSettings,
                        url: window.location.href,
                        storageArea: localStorage
                    });
                    
                    window.dispatchEvent(storageEvent);
                    console.log('Manual storage event dispatched for settings reset');
                } catch (e) {
                    console.error('Could not dispatch manual storage event:', e);
                }
            }
            
            // Hiển thị thông báo
            if (typeof Toast !== 'undefined') {
                Toast.show('Settings reset to default values', 'info');
            } else {
                alert('Settings reset to default values');
            }
            
            console.log('Settings reset to defaults:', defaultSettings);
        }
    }
}

// Initialize timer when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.timer = new SettingsTimer();
}); 