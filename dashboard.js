document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardStats();
});

async function fetchDashboardStats() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) return;

    try {
        const response = await fetch('/api/stats', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) return;

        const data = await response.json();

        // Update Stat Cards
        const numbersElements = document.querySelectorAll('.cardBox .card .numbers');
        if (numbersElements.length >= 4) {
            numbersElements[0].textContent = (data.viewsCount || 0).toLocaleString();
            numbersElements[1].textContent = (data.coursesCount || 0).toLocaleString();
            numbersElements[2].textContent = (data.messagesCount || 0).toLocaleString();
            numbersElements[3].textContent = "ETB 7,842";
        }

        // Render Recent Messages Table
        const tbody = document.querySelector('.recentOrders table tbody');
        if (tbody && Array.isArray(data.messages)) {
            if (data.messages.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 1rem;">No recent messages found.</td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = data.messages.map(msg => `
                    <tr>
                        <td>${escapeHTML(msg.sender || 'Anonymous')}</td>
                        <td>${escapeHTML(msg.message || '')}</td>
                        <td>${escapeHTML(msg.date || 'Today')}</td>
                        <td><span class="status ${msg.status === 'Delivered' ? 'delivered' : 'pending'}">${escapeHTML(msg.status || 'Pending')}</span></td>
                    </tr>
                `).join('');
            }
        }
    } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
