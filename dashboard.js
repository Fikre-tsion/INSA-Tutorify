// Admin Dashboard Script
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    let user = null;
    try {
        if (userStr) user = JSON.parse(userStr);
    } catch (e) {
        user = null;
    }

    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    // Fetch live dashboard statistics from API
    fetch('/api/stats', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => {
        if (!res.ok) throw new Error('Unauthorized or failed request');
        return res.json();
    })
    .then(data => {
        const numbersList = document.querySelectorAll('.cardBox .card .numbers');
        if (numbersList.length >= 4) {
            numbersList[0].textContent = (data.views || 0).toLocaleString();
            numbersList[1].textContent = (data.coursesCount || 0).toLocaleString();
            numbersList[2].textContent = (data.messagesCount || 0).toLocaleString();
            numbersList[3].textContent = (data.usersCount || 0).toLocaleString();
        }

        // Render Recent Messages into table if present
        const tableBody = document.querySelector('.recentOrders table tbody');
        if (tableBody && data.messages && data.messages.length > 0) {
            tableBody.innerHTML = data.messages.map(msg => `
                <tr>
                    <td>${escapeHTML(msg.firstName + ' ' + (msg.lastName || ''))}</td>
                    <td>${escapeHTML(msg.message)}</td>
                    <td>${escapeHTML(new Date(msg.date).toLocaleDateString())}</td>
                    <td><span class="status pending">${escapeHTML(msg.status || 'Pending')}</span></td>
                </tr>
            `).join('');
        }
    })
    .catch(err => {
        console.error('Error fetching admin stats:', err);
    });
});

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
