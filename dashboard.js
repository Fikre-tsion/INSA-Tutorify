// Admin Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    // Toggle navigation
    let toggle = document.querySelector('.toggle');
    let navigation = document.querySelector('.navigation');
    let main = document.querySelector('.main');

    if (toggle) {
        toggle.onclick = function() {
            navigation.classList.toggle('active');
            main.classList.toggle('active');
        }
    }

    // Hover effect on nav items
    document.querySelectorAll('.navigation ul li').forEach(li => {
        li.addEventListener('click', () => {
            document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
            li.classList.add('hovered');
        });
    });

    fetchStats();
});

async function fetchStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();

        // Update card numbers
        updateCardValue('Profile Views', data.views);
        updateCardValue('Tutorials', data.courseCount);
        updateCardValue('Comments', data.messageCount);
        updateCardValue('Earnings', 'ETB ' + (data.userCount * 100)); // Mock earnings

        // Update recent customers (users)
        const userTable = document.querySelector('.recentCustomers table');
        if (userTable) {
            userTable.innerHTML = `
                <thead>
                    <tr>
                        <td width="60px">Profile</td>
                        <td>Name / Role</td>
                    </tr>
                </thead>
                <tbody>
                    ${data.users.map(u => `
                        <tr>
                            <td width="60px">
                                <div class="imgBx"><img src="./images/digitalmarketing.png" alt="User" loading="lazy"></div>
                            </td>
                            <td>
                                <h4>${u.name}<br><span>${u.role}</span></h4>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
        }

        // Update recent messages
        const messageTable = document.querySelector('.recentOrders table tbody');
        if (messageTable) {
            messageTable.innerHTML = data.messages.map(m => `
                <tr>
                    <td>${m.name}</td>
                    <td>${m.message.substring(0, 20)}...</td>
                    <td>${m.email}</td>
                    <td><span class="status delivered">Message</span></td>
                </tr>
            `).join('');

            const tableHeader = document.querySelector('.recentOrders .cardHeader h2');
            if (tableHeader) tableHeader.textContent = 'Recent Messages';

            const thead = document.querySelector('.recentOrders table thead tr');
            if (thead) {
                thead.innerHTML = `
                    <td>Name</td>
                    <td>Message</td>
                    <td>Email</td>
                    <td>Status</td>
                `;
            }
        }

    } catch (err) {
        console.error("Error fetching stats:", err);
    }
}

function updateCardValue(name, value) {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const cardName = card.querySelector('.cardName');
        if (cardName && cardName.textContent === name) {
            const numbers = card.querySelector('.numbers');
            if (numbers) numbers.textContent = value;
        }
    });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
