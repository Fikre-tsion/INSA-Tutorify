document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    alert('Access denied. Please login as admin.');
    window.location.href = 'login.html';
    return;
  }

  try {
    const user = JSON.parse(userStr);
    if (!user || user.role !== 'admin') {
      alert('Access denied. Admin privileges required.');
      window.location.href = 'login.html';
      return;
    }
  } catch (e) {
    window.location.href = 'login.html';
    return;
  }

  // Fetch admin stats
  try {
    const response = await fetch('/api/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert('Session expired or unauthorized. Please login again.');
        window.location.href = 'login.html';
      }
      return;
    }

    const data = await response.json();

    // Update Card Counters
    const statViews = document.getElementById('stat-views');
    const statCourses = document.getElementById('stat-courses');
    const statMessages = document.getElementById('stat-messages');
    const statUsers = document.getElementById('stat-users');

    if (statViews) statViews.textContent = (data.views || 0).toLocaleString();
    if (statCourses) statCourses.textContent = (data.courseCount || 0).toLocaleString();
    if (statMessages) statMessages.textContent = (data.messageCount || 0).toLocaleString();
    if (statUsers) statUsers.textContent = (data.userCount || 0).toLocaleString();

    // Populate Recent Messages Table
    const messagesTableBody = document.querySelector('.recentOrders tbody');
    if (messagesTableBody && Array.isArray(data.messages) && data.messages.length > 0) {
      messagesTableBody.innerHTML = '';
      data.messages.slice(-10).reverse().forEach(msg => {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.textContent = `${msg.firstName || ''} ${msg.lastName || ''}`.trim() || 'Anonymous';

        const tdMsg = document.createElement('td');
        tdMsg.textContent = msg.message || '-';

        const tdDate = document.createElement('td');
        tdDate.textContent = msg.date ? new Date(msg.date).toLocaleDateString() : '-';

        const tdStatus = document.createElement('td');
        const spanStatus = document.createElement('span');
        spanStatus.className = 'status delivered';
        spanStatus.textContent = msg.status || 'Received';
        tdStatus.appendChild(spanStatus);

        tr.appendChild(tdName);
        tr.appendChild(tdMsg);
        tr.appendChild(tdDate);
        tr.appendChild(tdStatus);

        messagesTableBody.appendChild(tr);
      });
    }

    // Populate Recent Users Table
    const usersTable = document.querySelector('.recentCustomers table');
    if (usersTable && Array.isArray(data.users) && data.users.length > 0) {
      usersTable.innerHTML = '';
      data.users.slice(-5).reverse().forEach(usr => {
        const tr = document.createElement('tr');

        const tdImg = document.createElement('td');
        tdImg.style.width = '60px';
        const imgBx = document.createElement('div');
        imgBx.className = 'imgBx';
        const img = document.createElement('img');
        img.src = './images2/1.jpg';
        img.onerror = () => { img.src = './images/digitalmarketing.png'; };
        img.alt = usr.name || 'User';
        imgBx.appendChild(img);
        tdImg.appendChild(imgBx);

        const tdInfo = document.createElement('td');
        const h4 = document.createElement('h4');
        h4.textContent = usr.name || 'User';
        const br = document.createElement('br');
        const span = document.createElement('span');
        span.textContent = usr.role === 'admin' ? 'Administrator' : 'Registered Student';
        h4.appendChild(br);
        h4.appendChild(span);
        tdInfo.appendChild(h4);

        tr.appendChild(tdImg);
        tr.appendChild(tdInfo);

        usersTable.appendChild(tr);
      });
    }

  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
  }
});
