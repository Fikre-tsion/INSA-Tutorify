document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Toggle Sidebar
    let toggle = document.querySelector('.toggle');
    let navigation = document.querySelector('.navigation');
    let main = document.querySelector('.main');

    if (toggle) {
        toggle.onclick = function() {
            navigation.classList.toggle('active');
            main.classList.toggle('active');
        };
    }

    // Fetch and display stats
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        // Update cards
        const numbers = document.querySelectorAll('.card .numbers');
        if (numbers.length >= 4) {
            numbers[0].textContent = stats.views.toLocaleString();
            numbers[1].textContent = stats.courseCount;
            numbers[2].textContent = stats.messageCount;
            numbers[3].textContent = stats.userCount;
        }

        // Update Recent Messages (instead of Tutors for dynamic data)
        const recentMessagesTable = document.querySelector('.recentOrders table tbody');
        if (recentMessagesTable && stats.messages) {
            recentMessagesTable.innerHTML = stats.messages.map(msg => `
                <tr>
                    <td>${msg.name}</td>
                    <td>${msg.email}</td>
                    <td>${new Date(msg.date).toLocaleDateString()}</td>
                    <td><span class="status delivered">Message</span></td>
                </tr>
            `).join('');

            const cardHeaderH2 = document.querySelector('.recentOrders .cardHeader h2');
            if (cardHeaderH2) cardHeaderH2.textContent = 'Recent Messages';
        }

        // Update Recent Users (Customers)
        const recentUsersTable = document.querySelector('.recentCustomers table');
        if (recentUsersTable && stats.users) {
            recentUsersTable.innerHTML = stats.users.map(u => `
                <tr>
                    <td width="60px">
                        <div class="imgBx"><img src="./images/digitalmarketing.png" alt="User"></div>
                    </td>
                    <td>
                        <h4>${u.name}<br><span>${u.role}</span></h4>
                    </td>
                </tr>
            `).join('');

            const customerHeaderH2 = document.querySelector('.recentCustomers .cardHeader h2');
            if (customerHeaderH2) customerHeaderH2.textContent = 'Recent Users';
        }

    } catch (err) {
        console.error("Failed to fetch stats", err);
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
