async function fetchStats() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const stats = await response.json();

            // Assuming we have elements with these IDs or classes in dashboard.html
            // Based on dashboard.html: .numbers inside .card
            const cards = document.querySelectorAll('.card .numbers');
            if (cards.length >= 4) {
                cards[0].textContent = stats.users.toLocaleString(); // Total Users
                cards[1].textContent = stats.courses.toLocaleString(); // Total Courses
                cards[2].textContent = stats.contacts.toLocaleString(); // Total Messages
                // 4th card is Earnings, we leave it as is or update if we have data
            }
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

document.addEventListener('DOMContentLoaded', fetchStats);
