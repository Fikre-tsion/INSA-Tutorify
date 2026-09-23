// Admin Dashboard JS Logic
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'admin') {
        return;
    }

    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();

            // Update Card Stats
            const cards = document.querySelectorAll('.cardBox .card .numbers');
            if (cards.length >= 4) {
                cards[0].textContent = data.profileViews ? data.profileViews.toLocaleString() : '1,504';
                cards[1].textContent = data.coursesCount || '80';
                cards[2].textContent = data.messagesCount || '284';
                cards[3].textContent = 'ETB 7,842';
            }

            // Update Recent Messages / Orders Table
            const tbody = document.querySelector('.recentOrders table tbody');
            if (tbody && data.recentMessages && data.recentMessages.length > 0) {
                tbody.innerHTML = '';
                data.recentMessages.forEach(msg => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${escapeHTML(msg.name || 'User')}</td>
                        <td>${escapeHTML(msg.message || 'Inquiry')}</td>
                        <td>${new Date(msg.date).toLocaleDateString()}</td>
                        <td><span class="status delivered">Received</span></td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }
    } catch (err) {
        console.error('Failed to load dashboard stats:', err);
    }
});

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
