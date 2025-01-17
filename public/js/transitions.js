document.addEventListener('DOMContentLoaded', () => {
    // Thêm class cho container chính
    const mainContainer = document.querySelector('.container');
    mainContainer.classList.add('animate__animated', 'animate__fadeIn');

    // Xử lý chuyển trang
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                e.preventDefault();
                mainContainer.classList.remove('animate__fadeIn');
                mainContainer.classList.add('animate__fadeOut');
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            }
        });
    });
}); 