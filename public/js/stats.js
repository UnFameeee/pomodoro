document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo biểu đồ thời gian
    const timeChartCtx = document.getElementById('timeChart').getContext('2d');
    let timeChart = new Chart(timeChartCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Thời gian làm việc (phút)',
                data: [],
                backgroundColor: 'rgba(231, 76, 60, 0.2)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Khởi tạo lịch nhiệt
    const cal = new CalHeatMap();
    cal.init({
        itemSelector: "#heatmap",
        domain: "month",
        subDomain: "day",
        data: "/api/stats/heatmap",
        start: new Date().setMonth(new Date().getMonth() - 5),
        cellSize: 10,
        range: 6,
        legend: [2, 4, 6, 8],
        legendColors: {
            min: "#f1c40f",
            max: "#e74c3c"
        }
    });

    // Xử lý nút chọn khoảng thời gian
    document.querySelectorAll('[data-range]').forEach(button => {
        button.addEventListener('click', async () => {
            const range = button.dataset.range;
            const data = await fetchTimeData(range);
            updateTimeChart(timeChart, data);
            
            // Cập nhật active state cho nút
            document.querySelectorAll('[data-range]').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        });
    });

    // Mặc định hiển thị dữ liệu tuần
    document.querySelector('[data-range="week"]').click();
});

// Thêm debounce cho các sự kiện
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Lazy load cho Chart.js và Cal-heatmap
async function loadChartDependencies() {
    if (!window.Chart) {
        await import('https://cdn.jsdelivr.net/npm/chart.js');
    }
}

async function loadHeatmapDependencies() {
    if (!window.CalHeatMap) {
        await Promise.all([
            import('https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js'),
            import('https://cdn.jsdelivr.net/npm/cal-heatmap@3.6.2/cal-heatmap.min.js')
        ]);
    }
}

// Tối ưu cập nhật biểu đồ
function updateTimeChart(chart, data) {
    if (!data) return;

    // Chỉ cập nhật khi dữ liệu thay đổi
    const currentData = chart.data.datasets[0].data;
    const newData = data.values;
    
    if (JSON.stringify(currentData) !== JSON.stringify(newData)) {
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = newData;
        requestAnimationFrame(() => chart.update('none')); // Sử dụng requestAnimationFrame
    }
}

// Tối ưu fetch data
const dataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

async function fetchTimeData(range) {
    const cacheKey = `timeData_${range}`;
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return cached.data;
    }

    try {
        const response = await fetch(`/api/stats/time?range=${range}`);
        const data = await response.json();
        
        dataCache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
        
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        return null;
    }
}

// Hàm format thời gian
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins}m`;
} 