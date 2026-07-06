// Check authentication and role
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'admin') {
    alert('Access denied. Please login as admin.');
    window.location.href = 'login.html';
}

// Fetch and Render Dashboard Stats
const fetchStats = async () => {
    try {
        const res = await fetch('/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();

        // Update Stat Cards
        const statViews = document.querySelector('.cardBox .card:nth-child(1) .numbers');
        const statCourses = document.querySelector('.cardBox .card:nth-child(2) .numbers');
        const statMessages = document.querySelector('.cardBox .card:nth-child(3) .numbers');
        const statUsers = document.querySelector('.cardBox .card:nth-child(4) .numbers');

        if (statViews) statViews.textContent = data.views.toLocaleString();
        if (statCourses) statCourses.textContent = data.courseCount;
        if (statMessages) statMessages.textContent = data.messageCount;
        if (statUsers) statUsers.textContent = data.userCount;

        // Populate Recent Messages (Tutors table in HTML) - Secure Rendering
        const messageTableBody = document.querySelector('.details .recentOrders table tbody');
        if (messageTableBody) {
            messageTableBody.innerHTML = ''; // Clear current content
            if (data.messages.length > 0) {
                data.messages.forEach(msg => {
                    const tr = document.createElement('tr');

                    const tdName = document.createElement('td');
                    tdName.textContent = msg.name;
                    tr.appendChild(tdName);

                    const tdEmail = document.createElement('td');
                    tdEmail.textContent = msg.email;
                    tr.appendChild(tdEmail);

                    const tdMsg = document.createElement('td');
                    const truncated = msg.message.substring(0, 30) + (msg.message.length > 30 ? '...' : '');
                    tdMsg.textContent = truncated;
                    tr.appendChild(tdMsg);

                    const tdStatus = document.createElement('td');
                    const span = document.createElement('span');
                    span.className = 'status delivered';
                    span.textContent = 'New';
                    tdStatus.appendChild(span);
                    tr.appendChild(tdStatus);

                    messageTableBody.appendChild(tr);
                });
            } else {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.setAttribute('colspan', '4');
                td.textContent = 'No messages yet.';
                tr.appendChild(td);
                messageTableBody.appendChild(tr);
            }
        }

        // Populate Recent Users - Secure Rendering
        const userTable = document.querySelector('.recentCustomers table');
        if (userTable) {
            userTable.innerHTML = '';
            data.users.slice(-5).reverse().forEach(u => {
                const tr = document.createElement('tr');

                const tdImg = document.createElement('td');
                tdImg.setAttribute('width', '60px');
                const imgDiv = document.createElement('div');
                imgDiv.className = 'imgBx';
                const img = document.createElement('img');
                img.src = './digitalmarketing.png';
                img.alt = 'User';
                imgDiv.appendChild(img);
                tdImg.appendChild(imgDiv);
                tr.appendChild(tdImg);

                const tdInfo = document.createElement('td');
                const h4 = document.createElement('h4');
                h4.textContent = u.name;
                const br = document.createElement('br');
                h4.appendChild(br);
                const span = document.createElement('span');
                span.textContent = u.role;
                h4.appendChild(span);
                tdInfo.appendChild(h4);
                tr.appendChild(tdInfo);

                userTable.appendChild(tr);
            });
        }

    } catch (err) {
        console.error('Error fetching stats:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
};

document.addEventListener('DOMContentLoaded', fetchStats);

// Sidebar Toggle Logic
let toggle = document.querySelector('.toggle');
let navigation = document.querySelector('.navigation');
let main = document.querySelector('.main');

if (toggle) {
    toggle.onclick = function () {
        navigation.classList.toggle('active');
        main.classList.toggle('active');
    };
}

// Hover effect for nav items
document.querySelectorAll('.navigation ul li').forEach(li => {
    li.addEventListener('click', () => {
        document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
        li.classList.add('hovered');
    });
});
