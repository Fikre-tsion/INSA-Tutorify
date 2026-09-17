document.addEventListener('DOMContentLoaded', () => {
    // Check authentication & admin role
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    // Toggle menu
    const toggle = document.querySelector('.toggle');
    const navigation = document.querySelector('.navigation');
    const main = document.querySelector('.main');

    if (toggle && navigation && main) {
        toggle.setAttribute('aria-label', 'Toggle admin navigation menu');
        toggle.onclick = function() {
            navigation.classList.toggle('active');
            main.classList.toggle('active');
        };
    }

    // Highlight active navigation item
    document.querySelectorAll('.navigation ul li').forEach(li => {
        li.addEventListener('click', () => {
            document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
            li.classList.add('hovered');
        });
    });

    // Handle user image fallback
    const userImg = document.querySelector('.user img');
    if (userImg) {
        userImg.onerror = () => {
            userImg.src = './digitalmarketing.png';
        };
    }

    // Fetch dashboard statistics from backend API
    fetchStats(token);
});

async function fetchStats(token) {
    try {
        const response = await fetch('/api/stats', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('Session expired or unauthorized. Please log in again.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
            return;
        }

        const data = await response.json();
        updateDashboardUI(data);
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
    }
}

function updateDashboardUI(data) {
    const { stats, messages } = data;
    const cards = document.querySelectorAll('.cardBox .card .numbers');

    if (cards && cards.length >= 4 && stats) {
        cards[0].textContent = (stats.profileViews || 0).toLocaleString();
        cards[1].textContent = (stats.tutorials || 18).toLocaleString();
        cards[2].textContent = (stats.comments || (messages ? messages.length : 0)).toLocaleString();
        cards[3].textContent = 'ETB ' + (stats.earnings || 7842).toLocaleString();
    }

    // Render Recent Messages table
    const tableBody = document.querySelector('.recentOrders table tbody');
    const tableHeaderH2 = document.querySelector('.recentOrders .cardHeader h2');
    const tableHeaders = document.querySelectorAll('.recentOrders table thead tr td');

    if (tableHeaderH2) {
        tableHeaderH2.textContent = 'Recent Contact Messages';
    }

    if (tableHeaders && tableHeaders.length >= 4) {
        tableHeaders[0].textContent = 'Sender';
        tableHeaders[1].textContent = 'Message';
        tableHeaders[2].textContent = 'Date';
        tableHeaders[3].textContent = 'Status';
    }

    if (tableBody && messages && messages.length > 0) {
        tableBody.innerHTML = '';
        messages.slice().reverse().forEach(msg => {
            const tr = document.createElement('tr');
            const name = escapeHTML(`${msg.firstName || ''} ${msg.lastName || ''}`.trim() || msg.email);
            const content = escapeHTML(msg.message || '');
            const dateStr = msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'Recent';

            tr.innerHTML = `
                <td>${name}</td>
                <td title="${content}">${content.length > 40 ? content.substring(0, 40) + '...' : content}</td>
                <td>${dateStr}</td>
                <td><span class="status delivered">Received</span></td>
            `;
            tableBody.appendChild(tr);
        });
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

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
