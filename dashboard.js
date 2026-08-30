// Dashboard Navigation Toggle
const toggle = document.querySelector('.toggle');
const navigation = document.querySelector('.navigation');
const main = document.querySelector('.main');

if (toggle && navigation && main) {
    toggle.onclick = function() {
        navigation.classList.toggle('active');
        main.classList.toggle('active');
    };
}

// Navigation Item Active Hover State
document.querySelectorAll('.navigation ul li').forEach(li => {
    li.addEventListener('click', () => {
        document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
        li.classList.add('hovered');
    });
});

// Fetch and render dashboard metrics and table data from backend
async function fetchDashboardStats() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/stats', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch stats:', response.statusText);
            return;
        }

        const stats = await response.json();

        // Update Stat Cards
        const statViews = document.getElementById('stat-views');
        const statCourses = document.getElementById('stat-courses');
        const statMessages = document.getElementById('stat-messages');
        const statUsers = document.getElementById('stat-users');

        if (statViews) statViews.textContent = (stats.views || 0).toLocaleString();
        if (statCourses) statCourses.textContent = (stats.courseCount || 0).toLocaleString();
        if (statMessages) statMessages.textContent = (stats.messageCount || 0).toLocaleString();
        if (statUsers) statUsers.textContent = (stats.userCount || 0).toLocaleString();

        // Render Recent Messages Table
        const messagesTableBody = document.querySelector('#messagesTable tbody');
        if (messagesTableBody) {
            messagesTableBody.innerHTML = '';
            if (!stats.messages || stats.messages.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="4" style="text-align:center; padding: 1rem;">No contact messages yet.</td>';
                messagesTableBody.appendChild(tr);
            } else {
                stats.messages.slice().reverse().forEach(msg => {
                    const tr = document.createElement('tr');

                    const tdSender = document.createElement('td');
                    tdSender.textContent = `${msg.firstName || ''} ${msg.lastName || ''}`.trim() || msg.email;

                    const tdMsg = document.createElement('td');
                    tdMsg.textContent = msg.message;

                    const tdDate = document.createElement('td');
                    const formattedDate = msg.date ? new Date(msg.date).toLocaleDateString() : 'N/A';
                    tdDate.textContent = formattedDate;

                    const tdStatus = document.createElement('td');
                    const spanStatus = document.createElement('span');
                    spanStatus.className = 'status delivered';
                    spanStatus.textContent = 'Received';
                    tdStatus.appendChild(spanStatus);

                    tr.appendChild(tdSender);
                    tr.appendChild(tdMsg);
                    tr.appendChild(tdDate);
                    tr.appendChild(tdStatus);

                    messagesTableBody.appendChild(tr);
                });
            }
        }

        // Render Registered Users Table
        const usersTableBody = document.querySelector('#usersTable tbody');
        if (usersTableBody) {
            usersTableBody.innerHTML = '';
            if (!stats.users || stats.users.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="2" style="text-align:center; padding: 1rem;">No users registered yet.</td>';
                usersTableBody.appendChild(tr);
            } else {
                stats.users.forEach(u => {
                    const tr = document.createElement('tr');

                    const tdUser = document.createElement('td');
                    tdUser.style.display = 'flex';
                    tdUser.style.alignItems = 'center';
                    tdUser.style.gap = '0.75rem';

                    const img = document.createElement('img');
                    img.src = './digitalmarketing.png';
                    img.alt = u.name || u.email;
                    img.width = 40;
                    img.height = 40;
                    img.style.borderRadius = '50%';
                    img.style.objectFit = 'cover';

                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = u.name || u.email;

                    tdUser.appendChild(img);
                    tdUser.appendChild(nameSpan);

                    const tdRole = document.createElement('td');
                    const roleBadge = document.createElement('span');
                    roleBadge.className = u.role === 'admin' ? 'status delivered' : 'status pending';
                    roleBadge.textContent = u.role.toUpperCase();
                    tdRole.appendChild(roleBadge);

                    tr.appendChild(tdUser);
                    tr.appendChild(tdRole);

                    usersTableBody.appendChild(tr);
                });
            }
        }

    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
    }
}

// Load stats when DOM is ready
document.addEventListener('DOMContentLoaded', fetchDashboardStats);
