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

            // Save to localStorage with all settings
            localStorage.setItem('pomodoroSettings', JSON.stringify(formData));


            // Show success feedback
            const saveBtn = document.getElementById('saveButton');
            const originalContent = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
            saveBtn.disabled = true;
            
            setTimeout(() => {
                saveBtn.innerHTML = originalContent;
                saveBtn.disabled = false;
            }, 2000);

        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings');
        }
    }
}

// Initialize timer when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.timer = new SettingsTimer();
}); 