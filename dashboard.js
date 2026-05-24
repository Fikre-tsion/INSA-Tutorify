document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        const mainContent = document.querySelector('.main');
        if (mainContent) {
            mainContent.innerHTML = '<div style="padding: 2rem; color: #ff6a00; font-weight: bold;">Access Denied. Redirecting to login...</div>';
        }
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    try {
        const response = await fetch('/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            updateDashboard(data);
        } else {
            console.error('Failed to fetch dashboard stats');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

function updateDashboard(data) {
    // Update Stats Cards
    const cards = document.querySelectorAll('.card .numbers');
    if (cards.length >= 4) {
        cards[0].textContent = data.stats.profileViews;
        cards[1].textContent = data.stats.tutorials;
        cards[2].textContent = data.stats.comments;
        cards[3].textContent = data.stats.earnings;
    }

    // Update Recent Tutors Table
    const tutorsTableBody = document.querySelector('.recentOrders tbody');
    if (tutorsTableBody) {
        tutorsTableBody.innerHTML = data.recentTutors.map(tutor => `
            <tr>
                <td>${tutor.name}</td>
                <td>${tutor.course}</td>
                <td>${tutor.payment}</td>
                <td><span class="status ${tutor.status}">${tutor.status.charAt(0).toUpperCase() + tutor.status.slice(1)}</span></td>
            </tr>
        `).join('');
    }

    // Update Recent Customers List
    const customersTable = document.querySelector('.recentCustomers table');
    if (customersTable) {
        customersTable.innerHTML = data.recentCustomers.map(customer => `
            <tr>
                <td width="60px">
                    <div class="imgBx"><img src="${customer.image}" alt="${customer.name}" loading="lazy"></div>
                </td>
                <td>
                    <h4>${customer.name}<br><span>${customer.grade}</span></h4>
                </td>
            </tr>
        `).join('');
    }
}
