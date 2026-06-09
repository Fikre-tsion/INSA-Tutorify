document.addEventListener('DOMContentLoaded', () => {
    updateStats();
});

async function updateStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        // Update card numbers
        const cardNumbers = document.querySelectorAll('.cardBox .card .numbers');
        if (cardNumbers.length >= 4) {
            cardNumbers[0].textContent = stats.views.toLocaleString();
            cardNumbers[1].textContent = stats.courses.toLocaleString();
            cardNumbers[2].textContent = stats.contacts.toLocaleString();
            cardNumbers[3].textContent = stats.users.toLocaleString(); // Assuming users for the last one or something else
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}
