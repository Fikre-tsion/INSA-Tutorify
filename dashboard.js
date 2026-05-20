// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'admin') {
  alert('Access denied. Please login as admin.');
  window.location.href = 'login.html';
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

async function fetchDashboardData() {
  const statsContainer = document.getElementById('stats-container');
  const tutorsBody = document.querySelector('#tutors-table tbody');
  const customersTable = document.getElementById('customers-table');
  const loader = document.getElementById('stats-loader');

  try {
    const response = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to fetch stats');

    const data = await response.json();
    loader.style.display = 'none';

    // Render Stats Cards
    statsContainer.innerHTML = `
      <div class="card">
        <div>
          <div class="numbers">${data.stats.profileViews.toLocaleString()}</div>
          <div class="cardName">Profile Views</div>
        </div>
        <div class="iconBx"><ion-icon name="eye-outline"></ion-icon></div>
      </div>
      <div class="card">
        <div>
          <div class="numbers">${data.stats.tutorials}</div>
          <div class="cardName">Tutorials</div>
        </div>
        <div class="iconBx"><ion-icon name="school-outline"></ion-icon></div>
      </div>
      <div class="card">
        <div>
          <div class="numbers">${data.stats.comments}</div>
          <div class="cardName">Comments</div>
        </div>
        <div class="iconBx"><ion-icon name="chatbubbles-outline"></ion-icon></div>
      </div>
      <div class="card">
        <div>
          <div class="numbers">ETB ${data.stats.earnings.toLocaleString()}</div>
          <div class="cardName">Earnings</div>
        </div>
        <div class="iconBx"><ion-icon name="cash-outline"></ion-icon></div>
      </div>
    `;

    // Render Tutors
    tutorsBody.innerHTML = data.tutors.map(tutor => `
      <tr>
        <td>${tutor.name}</td>
        <td>${tutor.course}</td>
        <td>${tutor.payment}</td>
        <td><span class="status ${tutor.status}">${tutor.status.charAt(0).toUpperCase() + tutor.status.slice(1)}</span></td>
      </tr>
    `).join('');

    // Render Customers
    customersTable.innerHTML = data.customers.map(customer => `
      <tr>
        <td width="60px">
          <div class="imgBx"><img src="${customer.image}" alt="${customer.name}"></div>
        </td>
        <td>
          <h4>${customer.name}<br><span>${customer.grade}</span></h4>
        </td>
      </tr>
    `).join('');

  } catch (error) {
    console.error('Dashboard Error:', error);
    loader.textContent = 'Error loading dashboard data.';
  }
}

document.addEventListener('DOMContentLoaded', fetchDashboardData);

document.querySelectorAll('.navigation ul li').forEach(li => {
  li.addEventListener('click', () => {
    document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
    li.classList.add('hovered');
  });
});
