// Authentication check for Admin Dashboard
const token = localStorage.getItem('token');
let user = null;
try {
    user = JSON.parse(localStorage.getItem('user'));
} catch (e) {
    user = null;
}

if (!token || !user || (user && user.role !== 'admin')) {
    window.location.href = 'login.html';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Helper to escape HTML strings
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
    // Navigation toggle functionality
    const toggle = document.querySelector('.toggle');
    const navigation = document.querySelector('.navigation');
    const main = document.querySelector('.main');

    if (toggle && navigation && main) {
        toggle.setAttribute('aria-label', 'Toggle Dashboard Menu');
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('tabindex', '0');

        const toggleMenu = () => {
            navigation.classList.toggle('active');
            main.classList.toggle('active');
        };

        toggle.onclick = toggleMenu;
        toggle.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu();
            }
        };
    }

    // Navigation item highlight
    const navItems = document.querySelectorAll('.navigation ul li');
    navItems.forEach(li => {
        li.addEventListener('click', () => {
            navItems.forEach(x => x.classList.remove('hovered'));
            li.classList.add('hovered');
        });
    });

    // Fetch live dashboard statistics
    fetchDashboardStats();
});

async function fetchDashboardStats() {
    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                logout();
            }
            return;
        }

        const data = await response.json();

        // Update card metrics
        const numbers = document.querySelectorAll('.cardBox .card .numbers');
        if (numbers.length >= 4) {
            numbers[0].textContent = (data.pageViews || 0).toLocaleString();
            numbers[1].textContent = (data.coursesCount || 0).toLocaleString();
            numbers[2].textContent = (data.messagesCount || 0).toLocaleString();
            numbers[3].textContent = (data.usersCount || 0).toLocaleString();
        }

        // Render Recent Messages table
        const tableBody = document.querySelector('.recentOrders table tbody');
        if (tableBody && Array.isArray(data.recentMessages) && data.recentMessages.length > 0) {
            tableBody.innerHTML = data.recentMessages.map(msg => `
                <tr>
                    <td>${escapeHTML(msg.name)}</td>
                    <td>${escapeHTML(msg.message)}</td>
                    <td>${msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'Recent'}</td>
                    <td><span class="status delivered">Received</span></td>
                </tr>
            `).join('');
        }

    } catch (err) {
        console.error('Failed to fetch stats:', err);
    }
}
