// Check authentication with explicit null guard
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user || user.role !== 'admin') {
  alert('Access denied. Please login as an admin account.');
  window.location.href = 'login.html';
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Fetch and render admin statistics from backend
async function fetchDashboardData() {
  const statsContainer = document.getElementById('stats-container');
  const tutorsTable = document.querySelector('#tutors-table tbody');
  const customersTable = document.getElementById('customers-table');
  const loader = document.getElementById('stats-loader');

  try {
    const response = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert('Session expired or unauthorized. Please login again.');
        logout();
        return;
      }
      throw new Error('Failed to fetch dashboard statistics.');
    }

    const data = await response.json();
    if (loader) loader.style.display = 'none';

    // Render Cards
    if (statsContainer) {
      statsContainer.innerHTML = '';

      const cards = [
        { title: 'Profile Views', val: (data.stats.profileViews || 0).toLocaleString(), icon: 'eye-outline' },
        { title: 'Tutorials', val: data.stats.tutorials || 0, icon: 'school-outline' },
        { title: 'Comments', val: data.stats.comments || 0, icon: 'chatbubbles-outline' },
        { title: 'Earnings', val: `ETB ${(data.stats.earnings || 0).toLocaleString()}`, icon: 'cash-outline' }
      ];

      cards.forEach(card => {
        const divCard = document.createElement('div');
        divCard.className = 'card';

        const divText = document.createElement('div');
        const divNum = document.createElement('div');
        divNum.className = 'numbers';
        divNum.textContent = card.val;

        const divName = document.createElement('div');
        divName.className = 'cardName';
        divName.textContent = card.title;

        divText.appendChild(divNum);
        divText.appendChild(divName);

        const divIcon = document.createElement('div');
        divIcon.className = 'iconBx';
        const ionIcon = document.createElement('ion-icon');
        ionIcon.setAttribute('name', card.icon);
        divIcon.appendChild(ionIcon);

        divCard.appendChild(divText);
        divCard.appendChild(divIcon);

        statsContainer.appendChild(divCard);
      });
    }

    // Render Tutors Table
    if (tutorsTable && data.tutors) {
      tutorsTable.innerHTML = '';
      data.tutors.forEach(tutor => {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.textContent = tutor.name;

        const tdCourse = document.createElement('td');
        tdCourse.textContent = tutor.course;

        const tdPay = document.createElement('td');
        tdPay.textContent = tutor.payment;

        const tdStatus = document.createElement('td');
        const spanStatus = document.createElement('span');
        spanStatus.className = `status ${tutor.status}`;
        spanStatus.textContent = tutor.status.charAt(0).toUpperCase() + tutor.status.slice(1);
        tdStatus.appendChild(spanStatus);

        tr.appendChild(tdName);
        tr.appendChild(tdCourse);
        tr.appendChild(tdPay);
        tr.appendChild(tdStatus);

        tutorsTable.appendChild(tr);
      });
    }

    // Render Customers Table
    if (customersTable && data.customers) {
      customersTable.innerHTML = '';
      data.customers.forEach(customer => {
        const tr = document.createElement('tr');

        const tdImg = document.createElement('td');
        tdImg.style.width = '60px';
        const imgBx = document.createElement('div');
        imgBx.className = 'imgBx';

        const img = document.createElement('img');
        img.src = customer.image || './digitalmarketing.png';
        img.alt = customer.name;
        imgBx.appendChild(img);
        tdImg.appendChild(imgBx);

        const tdInfo = document.createElement('td');
        const h4 = document.createElement('h4');
        h4.textContent = customer.name;
        const br = document.createElement('br');
        const span = document.createElement('span');
        span.textContent = customer.grade;

        h4.appendChild(br);
        h4.appendChild(span);
        tdInfo.appendChild(h4);

        tr.appendChild(tdImg);
        tr.appendChild(tdInfo);

        customersTable.appendChild(tr);
      });
    }

  } catch (err) {
    console.error('Dashboard Error:', err);
    if (loader) loader.textContent = 'Error loading dashboard data.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchDashboardData();

  // Navigation Drawer Toggle
  const toggle = document.querySelector('.toggle');
  const navigation = document.querySelector('.navigation');
  const main = document.querySelector('.main');

  if (toggle && navigation && main) {
    toggle.onclick = function() {
      navigation.classList.toggle('active');
      main.classList.toggle('active');
    };
  }

  // Hover Effect for Navigation Items
  document.querySelectorAll('.navigation ul li').forEach(li => {
    li.addEventListener('click', () => {
      document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
      li.classList.add('hovered');
    });
  });
});
