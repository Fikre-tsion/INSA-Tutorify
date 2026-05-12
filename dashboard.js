// Theme Toggle for Dashboard
const themeToggle = document.querySelector('#theme-toggle');
const currentTheme = localStorage.getItem('theme');

const setTheme = (theme) => {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        if (themeToggle) themeToggle.innerHTML = '<ion-icon name="moon-outline"></ion-icon>';
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        if (themeToggle) themeToggle.innerHTML = '<ion-icon name="sunny-outline"></ion-icon>';
    }
}

if (currentTheme) {
    setTheme(currentTheme);
} else {
    setTheme('light');
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        let theme = 'light';
        if (!document.body.classList.contains('dark-mode')) {
            theme = 'dark';
        }
        setTheme(theme);
        localStorage.setItem('theme', theme);
    });
}

// --- Live Dashboard Data ---
async function fetchStats() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            updateDashboard(data);
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

function updateDashboard(data) {
    // Update count cards
    const cards = document.querySelectorAll('.cardBox .card .numbers');
    if (cards.length >= 4) {
        cards[0].innerText = data.totalUsers.toLocaleString();
        cards[1].innerText = data.totalCourses.toLocaleString();
        cards[2].innerText = data.totalEnrollments.toLocaleString();
        cards[3].innerText = data.totalContacts.toLocaleString();
    }

    // Update Recent Users table
    const recentUsersTable = document.querySelector('.recentOrders table tbody');
    if (recentUsersTable && data.recentUsers) {
        recentUsersTable.innerHTML = data.recentUsers.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td><span class="status delivered">Active</span></td>
            </tr>
        `).join('');
    }

    // Update Recent Contacts
    const recentCustomersList = document.querySelector('.recentCustomers table');
    if (recentCustomersList && data.recentContacts) {
        recentCustomersList.innerHTML = `
            <thead>
                <tr><td colspan="2"><h2>Recent Messages</h2></td></tr>
            </thead>
            <tbody>
                ${data.recentContacts.map(contact => `
                    <tr>
                        <td width="60px">
                            <div class="imgBx"><ion-icon name="mail-outline" style="font-size: 2rem;"></ion-icon></div>
                        </td>
                        <td>
                            <h4>${contact.name}<br><span>${contact.message.substring(0, 30)}...</span></h4>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
    // Refresh stats every 30 seconds
    setInterval(fetchStats, 30000);
});

// UI Logic
let toggle = document.querySelector('.toggle');
let navigation = document.querySelector('.navigation');
let main = document.querySelector('.main');

if (toggle) {
    toggle.onclick = function() {
        navigation.classList.toggle('active');
        main.classList.toggle('active');
    }
}

document.querySelectorAll('.navigation ul li').forEach(li => {
    li.addEventListener('click', () => {
        document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
        li.classList.add('hovered');
    });
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
window.logout = logout;
