/**
 * Dashboard JS
 * Fetches and displays admin statistics from the API.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        alert('Access denied. Please login as admin.');
        window.location.href = 'login.html';
        return;
    }

    // Update Profile Image and Name if available
    const userImg = document.querySelector('.user img');
    if (userImg) {
        userImg.alt = user.name;
    }

    // Fetch Stats
    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                logout();
            }
            throw new Error('Failed to fetch stats');
        }

        const stats = await response.json();

        // Update Stats Cards
        // We need to ensure the HTML has IDs for these, or target by order/name
        const cards = document.querySelectorAll('.card .numbers');
        if (cards.length >= 4) {
            cards[0].textContent = stats.users.toLocaleString(); // Total Users (was Profile Views)
            cards[1].textContent = stats.courses.toLocaleString(); // Tutorials
            cards[2].textContent = stats.messages.toLocaleString(); // Comments/Messages
            cards[3].textContent = `$${stats.earnings.toLocaleString()}`; // Earnings
        }

        // Update Card Names to reflect actual data
        const cardNames = document.querySelectorAll('.card .cardName');
        if (cardNames.length >= 4) {
            cardNames[0].textContent = 'Total Users';
            cardNames[2].textContent = 'Messages';
        }

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Navigation Toggle logic moved from inline script
let toggle = document.querySelector('.toggle');
let navigation = document.querySelector('.navigation');
let main = document.querySelector('.main');

if (toggle) {
    toggle.onclick = function() {
        navigation.classList.toggle('active');
        main.classList.toggle('active');
    };
}

document.querySelectorAll('.navigation ul li').forEach(li => {
    li.addEventListener('click', () => {
        document.querySelectorAll('.navigation ul li').forEach(x => x.classList.remove('hovered'));
        li.classList.add('hovered');
    });
});
