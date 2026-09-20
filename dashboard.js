document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/stats', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            console.error('Failed to fetch stats');
            return;
        }

        const data = await response.json();

        // Update statistics cards
        if (data.stats) {
            const statViews = document.getElementById('statViews');
            if (statViews) statViews.textContent = (data.stats.views || 0).toLocaleString();

            const statTutorials = document.getElementById('statTutorials');
            if (statTutorials) statTutorials.textContent = data.coursesCount || data.stats.tutorials || 0;

            const statComments = document.getElementById('statComments');
            if (statComments) statComments.textContent = data.messagesCount || data.stats.comments || 0;

            const statEarnings = document.getElementById('statEarnings');
            if (statEarnings) statEarnings.textContent = data.stats.earnings || '7,842';
        }

        // Update Recent Messages / Contact Submissions table
        const messagesTableBody = document.getElementById('messagesTableBody');
        if (messagesTableBody && Array.isArray(data.messages) && data.messages.length > 0) {
            messagesTableBody.innerHTML = '';

            // Show latest messages first
            const sortedMessages = [...data.messages].reverse();
            sortedMessages.forEach((msg, index) => {
                const tr = document.createElement('tr');

                const tdSender = document.createElement('td');
                tdSender.textContent = msg.name || 'Anonymous';

                const tdMessage = document.createElement('td');
                tdMessage.textContent = msg.message || 'No content';

                const tdDate = document.createElement('td');
                const formattedDate = msg.date ? new Date(msg.date).toLocaleDateString() : new Date().toLocaleDateString();
                tdDate.textContent = formattedDate;

                const tdStatus = document.createElement('td');
                const statusSpan = document.createElement('span');

                // Alternate sample statuses for visual styling
                if (index % 3 === 0) {
                    statusSpan.className = 'status delivered';
                    statusSpan.textContent = 'Delivered';
                } else if (index % 3 === 1) {
                    statusSpan.className = 'status pending';
                    statusSpan.textContent = 'Pending';
                } else {
                    statusSpan.className = 'status inprogress';
                    statusSpan.textContent = 'In Progress';
                }

                tdStatus.appendChild(statusSpan);

                tr.appendChild(tdSender);
                tr.appendChild(tdMessage);
                tr.appendChild(tdDate);
                tr.appendChild(tdStatus);

                messagesTableBody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error('Error loading dashboard stats:', err);
    }
});
