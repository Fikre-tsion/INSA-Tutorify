// Check authentication
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'admin') {
  alert('Access denied. Please login as admin.');
  window.location.href = 'login.html';
}

async function fetchStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const stats = await response.json();
            updateStatsUI(stats);
        } else {
            console.error('Failed to fetch stats');
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

function updateStatsUI(stats) {
    const cardBox = document.querySelector('.cardBox');
    if (cardBox) {
        cardBox.innerHTML = `
        <div class="card">
          <div>
            <div class="numbers">${stats.profileViews}</div>
            <div class="cardName">Profile Views</div>
          </div>
          <div class="iconBx">
            <ion-icon name="eye-outline"></ion-icon>
          </div>
        </div>
        <div class="card">
          <div>
            <div class="numbers">${stats.tutorials}</div>
            <div class="cardName">Tutorials</div>
          </div>
          <div class="iconBx">
            <ion-icon name="school-outline"></ion-icon>
          </div>
        </div>
        <div class="card">
          <div>
            <div class="numbers">${stats.comments}</div>
            <div class="cardName">Comments</div>
          </div>
          <div class="iconBx">
            <ion-icon name="chatbubbles-outline"></ion-icon>
          </div>
        </div>
        <div class="card">
          <div>
            <div class="numbers">${stats.earnings}</div>
            <div class="cardName">Earnings</div>
          </div>
          <div class="iconBx">
            <ion-icon name="cash-outline"></ion-icon>
          </div>
        </div>
        `;
    }
}

window.addEventListener('DOMContentLoaded', fetchStats);

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

let toggle = document.querySelector('.toggle');
let navigation = document.querySelector('.navigation');
let main = document.querySelector('.main');

if (toggle) {
    toggle.onclick = function() {
      navigation.classList.toggle('active');
      main.classList.toggle('active');
    }
}

document.querySelectorAll('.navigation ul li').forEach(li => {
  li.addEventListener('click', () => {
    document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
    li.classList.add('hovered');
  });
});
