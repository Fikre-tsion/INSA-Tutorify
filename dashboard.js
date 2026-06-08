async function updateStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        const usersCount = document.getElementById('stat-users');
        const coursesCount = document.getElementById('stat-courses');
        const contactsCount = document.getElementById('stat-contacts');

        if (usersCount) usersCount.textContent = stats.users.toLocaleString();
        if (coursesCount) coursesCount.textContent = stats.courses.toLocaleString();
        if (contactsCount) contactsCount.textContent = stats.contacts.toLocaleString();
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

document.addEventListener('DOMContentLoaded', updateStats);
