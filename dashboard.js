const updateStats = async () => {
  try {
    const response = await fetch('/api/stats');
    const stats = await response.json();

    const cardBox = document.querySelector('.cardBox');
    if (cardBox) {
      cardBox.innerHTML = `
        <div class="card">
          <div>
            <div class="numbers">${stats.profileViews.toLocaleString()}</div>
            <div class="cardName">Profile Views</div>
          </div>
          <div class="iconBx">
            <ion-icon name="eye-outline"></ion-icon>
          </div>
        </div>
        <div class="card">
          <div>
            <div class="numbers">${stats.courses}</div>
            <div class="cardName">Tutorials</div>
          </div>
          <div class="iconBx">
            <ion-icon name="school-outline"></ion-icon>
          </div>
        </div>
        <div class="card">
          <div>
            <div class="numbers">${stats.contacts}</div>
            <div class="cardName">Messages</div>
          </div>
          <div class="iconBx">
            <ion-icon name="chatbubbles-outline"></ion-icon>
          </div>
        </div>
        <div class="card">
          <div>
            <div class="numbers">${stats.users}</div>
            <div class="cardName">Total Users</div>
          </div>
          <div class="iconBx">
            <ion-icon name="people-outline"></ion-icon>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error updating stats:', error);
  }
};

document.addEventListener('DOMContentLoaded', updateStats);
