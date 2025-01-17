document.addEventListener('DOMContentLoaded', () => {
    const notificationToggle = document.getElementById('notifications');
    const settingsForm = document.getElementById('settingsForm');

    // Lấy trạng thái thông báo từ localStorage
    const notificationsEnabled = localStorage.getItem('notificationsEnabled') !== 'false';
    notificationToggle.checked = notificationsEnabled;

    // Lưu trạng thái thông báo khi thay đổi
    notificationToggle.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        localStorage.setItem('notificationsEnabled', enabled);
        
        // Cập nhật trạng thái thông báo trong timer
        window.dispatchEvent(new CustomEvent('notificationSettingChanged', {
            detail: { enabled }
        }));
    });

    // Xử lý form submit
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(settingsForm);
        const settings = {
            workTime: parseInt(formData.get('workTime')),
            shortBreak: parseInt(formData.get('shortBreak')),
            longBreak: parseInt(formData.get('longBreak')),
            notifications: formData.get('notifications') === 'on'
        };

        try {
            const response = await fetch('/settings/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Cập nhật timer với settings mới
                    window.dispatchEvent(new CustomEvent('settingsUpdated', {
                        detail: settings
                    }));
                    
                    alert('Cài đặt đã được lưu thành công!');
                }
            }
        } catch (error) {
            console.error('Lỗi khi lưu cài đặt:', error);
            alert('Đã xảy ra lỗi khi lưu cài đặt');
        }
    });
}); 