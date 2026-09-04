document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        return;
    }

    try {
        const response = await fetch('/api/stats', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch dashboard stats');
            return;
        }

        const data = await response.json();
        const stats = data.stats || {};

        // Update Card Numbers
        const numbersList = document.querySelectorAll('.cardBox .card .numbers');
        if (numbersList.length >= 4) {
            numbersList[0].textContent = (stats.profileViews || 1504).toLocaleString();
            numbersList[1].textContent = (stats.tutorialsCount || 80).toLocaleString();
            numbersList[2].textContent = (stats.commentsCount || 284).toLocaleString();
            numbersList[3].textContent = (stats.earnings || 7842).toLocaleString();
        }

        // Populate Recent Tutors
        if (stats.recentTutors && Array.isArray(stats.recentTutors)) {
            const tutorsTbody = document.querySelector('.recentOrders table tbody');
            if (tutorsTbody) {
                tutorsTbody.innerHTML = '';
                stats.recentTutors.forEach(tutor => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${tutor.name}</td>
                        <td>${tutor.course}</td>
                        <td>${tutor.payment}</td>
                        <td><span class="status ${tutor.statusClass}">${tutor.status}</span></td>
                    `;
                    tutorsTbody.appendChild(tr);
                });
            }
        }

        // Populate Recent Customers
        if (stats.recentCustomers && Array.isArray(stats.recentCustomers)) {
            const customersTable = document.querySelector('.recentCustomers table');
            if (customersTable) {
                customersTable.innerHTML = '';
                stats.recentCustomers.forEach(customer => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td width="60px">
                            <div class="imgBx"><img src="${customer.avatar}" alt="Customer"></div>
                        </td>
                        <td>
                            <h4>${customer.name}<br><span>${customer.grade}</span></h4>
                        </td>
                    `;
                    customersTable.appendChild(tr);
                });
            }
        }
    } catch (err) {
        console.error('Error fetching admin stats:', err);
    }
});
