document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || (user && user.role !== 'admin')) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
            return;
        }

        const data = await response.json();

        // Update Stats Cards
        updateStat('stat-views', data.views);
        updateStat('stat-courses', data.courseCount);
        updateStat('stat-messages', data.messageCount);
        updateStat('stat-users', data.userCount);

        // Render Recent Messages Table
        const messageTableBody = document.querySelector('.recentOrders table tbody');
        if (messageTableBody && data.messages) {
            messageTableBody.innerHTML = ''; // Clear
            if (data.messages.length === 0) {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = 4;
                td.textContent = 'No messages yet.';
                tr.appendChild(td);
                messageTableBody.appendChild(tr);
            } else {
                data.messages.forEach(msg => {
                    const tr = document.createElement('tr');

                    const nameTd = document.createElement('td');
                    nameTd.textContent = msg.name;

                    const subjectTd = document.createElement('td');
                    subjectTd.textContent = 'Message';

                    const dateTd = document.createElement('td');
                    dateTd.textContent = new Date(msg.date).toLocaleDateString();

                    const statusTd = document.createElement('td');
                    const span = document.createElement('span');
                    span.className = 'status delivered';
                    span.textContent = 'New';
                    statusTd.appendChild(span);

                    tr.appendChild(nameTd);
                    tr.appendChild(subjectTd);
                    tr.appendChild(dateTd);
                    tr.appendChild(statusTd);
                    messageTableBody.appendChild(tr);
                });
            }
        }

        // Render Recent Users
        const userTable = document.querySelector('.recentCustomers table');
        if (userTable && data.users) {
            userTable.innerHTML = ''; // Clear
            const headerTr = document.createElement('tr');
            const headerTd = document.createElement('td');
            headerTd.colSpan = 2;
            const h2 = document.createElement('h2');
            h2.textContent = 'Recent Users';
            headerTd.appendChild(h2);
            headerTr.appendChild(headerTd);
            userTable.appendChild(headerTr);

            data.users.forEach(u => {
                const tr = document.createElement('tr');

                const imgTd = document.createElement('td');
                imgTd.width = '60px';
                const imgBx = document.createElement('div');
                imgBx.className = 'imgBx';
                const img = document.createElement('img');
                img.src = './images/digitalmarketing.png'; // Fallback
                img.alt = 'User';
                imgBx.appendChild(img);
                imgTd.appendChild(imgBx);

                const infoTd = document.createElement('td');
                const h4 = document.createElement('h4');
                h4.textContent = u.name;
                const br = document.createElement('br');
                const span = document.createElement('span');
                span.textContent = u.role;
                h4.appendChild(br);
                h4.appendChild(span);
                infoTd.appendChild(h4);

                tr.appendChild(imgTd);
                tr.appendChild(infoTd);
                userTable.appendChild(tr);
            });
        }

    } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
    }
});

function updateStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = (value || 0).toLocaleString();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Sidebar Toggle
let toggle = document.querySelector('.toggle');
let navigation = document.querySelector('.navigation');
let main = document.querySelector('.main');

if (toggle && navigation && main) {
    toggle.onclick = function() {
        navigation.classList.toggle('active');
        main.classList.toggle('active');
    }
}
