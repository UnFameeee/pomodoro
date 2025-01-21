class Toast {
    static show(message, type = 'success') {
        console.log("Creating toast...");

        // Create toast container if not exists
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} slide-in`;
        
        // Create icon based on type
        const icon = document.createElement('i');
        switch (type) {
            case 'success':
                icon.className = 'fas fa-check-circle';
                break;
            case 'warning':
                icon.className = 'fas fa-exclamation-circle';
                break;
            case 'error':
                icon.className = 'fas fa-times-circle';
                break;
        }
        
        // Create message element
        const messageEl = document.createElement('span');
        messageEl.textContent = message;
        
        // Append elements
        toast.appendChild(icon);
        toast.appendChild(messageEl);
        toastContainer.appendChild(toast);

        console.log("Toast element created:", toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.add('slide-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Thêm CSS cho toast
// Toast.show('Settings saved successfully!', 'success');
// Toast.show('Please check your input', 'error');
// Toast.show('Loading...', 'info'); 