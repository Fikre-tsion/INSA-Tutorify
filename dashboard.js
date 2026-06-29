// dashboard.js - Admin Dashboard Logic

const fetchStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': token }
        });

        if (!response.ok) throw new Error('Failed to fetch stats');

        const stats = await response.json();

        // Update Stat Cards
        const statElements = document.querySelectorAll('.cardBox .card .numbers');
        if (statElements.length >= 4) {
            statElements[0].textContent = stats.views.toLocaleString();
            statElements[1].textContent = stats.courseCount;
            statElements[2].textContent = stats.messageCount;
            statElements[3].textContent = stats.userCount;

            // Update Card Names to match data
            const statNames = document.querySelectorAll('.cardBox .card .cardName');
            statNames[0].textContent = 'Total Views';
            statNames[1].textContent = 'Active Courses';
            statNames[2].textContent = 'Messages';
            statNames[3].textContent = 'Total Users';
        }

        // Update Recent Messages (Tutors table for now)
        const recentActivityTable = document.querySelector('.recentOrders table tbody');
        if (recentActivityTable) {
            recentActivityTable.innerHTML = '';
            stats.messages.forEach(msg => {
                const tr = document.createElement('tr');

                const tdName = document.createElement('td');
                tdName.textContent = msg.name;

                const tdType = document.createElement('td');
                tdType.textContent = 'Message';

                const tdDate = document.createElement('td');
                tdDate.textContent = new Date(msg.date).toLocaleDateString();

                const tdStatus = document.createElement('td');
                const span = document.createElement('span');
                span.className = 'status delivered';
                span.textContent = 'New';
                tdStatus.appendChild(span);

                tr.appendChild(tdName);
                tr.appendChild(tdType);
                tr.appendChild(tdDate);
                tr.appendChild(tdStatus);

                recentActivityTable.appendChild(tr);
            });

            // Update Table Header
            document.querySelector('.recentOrders .cardHeader h2').textContent = 'Recent Messages';
            const thead = document.querySelector('.recentOrders table thead');
            thead.innerHTML = '';
            const headerTr = document.createElement('tr');
            ['Name', 'Type', 'Date', 'Status'].forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                headerTr.appendChild(td);
            });
            thead.appendChild(headerTr);
        }

        // Update Recent Users
        const recentUsersTable = document.querySelector('.recentCustomers table');
        if (recentUsersTable) {
            recentUsersTable.innerHTML = '';
            stats.users.forEach(user => {
                const tr = document.createElement('tr');

                const tdImg = document.createElement('td');
                tdImg.width = '60px';
                const imgDiv = document.createElement('div');
                imgDiv.className = 'imgBx';
                const img = document.createElement('img');
                img.src = './images/digitalmarketing.png';
                img.alt = 'User';
                imgDiv.appendChild(img);
                tdImg.appendChild(imgDiv);

                const tdInfo = document.createElement('td');
                const h4 = document.createElement('h4');
                h4.textContent = user.name;
                const br = document.createElement('br');
                const span = document.createElement('span');
                span.textContent = user.role;
                h4.appendChild(br);
                h4.appendChild(span);
                tdInfo.appendChild(h4);

                tr.appendChild(tdImg);
                tr.appendChild(tdInfo);

                recentUsersTable.appendChild(tr);
            });
        }

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
});
