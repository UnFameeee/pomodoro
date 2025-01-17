class Toast {
    static show(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${this.getIcon(type)}"></i>
            </div>
            <div class="toast-message">${message}</div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    static getIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }
}

// Thêm CSS cho toast
const toastStyle = document.createElement('style');
toastStyle.textContent = `
    .toast-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem;
        border-radius: 0.5rem;
        background: white;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 1rem;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        z-index: 9999;
    }

    .toast-notification.show {
        transform: translateX(0);
    }

    .toast-icon {
        font-size: 1.5rem;
    }

    .toast-success .toast-icon { color: #2ecc71; }
    .toast-error .toast-icon { color: #e74c3c; }
    .toast-warning .toast-icon { color: #f1c40f; }
    .toast-info .toast-icon { color: #3498db; }
`;
document.head.appendChild(toastStyle); 