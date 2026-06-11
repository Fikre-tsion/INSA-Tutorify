document.addEventListener('DOMContentLoaded', () => {
    const recentTutorsBody = document.querySelector('.recentOrders tbody');

    async function updateStats() {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();

            const cards = document.querySelectorAll('.cardBox .card .numbers');
            if (cards.length >= 4) {
                cards[0].textContent = (data.users * 10 + 1500).toLocaleString();
                cards[1].textContent = data.courses.toLocaleString();
                cards[2].textContent = data.contacts.toLocaleString();
                cards[3].textContent = 'ETB ' + (data.courses * 500).toLocaleString();
            }

            if (data.recentTutors && recentTutorsBody) {
                recentTutorsBody.innerHTML = '';
                data.recentTutors.forEach(tutor => {
                    const tr = document.createElement('tr');

                    // Security: Using textContent for all user-visible fields
                    const nameTd = document.createElement('td');
                    nameTd.textContent = tutor.name;
                    tr.appendChild(nameTd);

                    const courseTd = document.createElement('td');
                    courseTd.textContent = tutor.course;
                    tr.appendChild(courseTd);

                    const paymentTd = document.createElement('td');
                    paymentTd.textContent = tutor.payment;
                    tr.appendChild(paymentTd);

                    const statusTd = document.createElement('td');
                    const statusSpan = document.createElement('span');
                    statusSpan.className = `status ${tutor.status}`;
                    statusSpan.textContent = tutor.status.charAt(0).toUpperCase() + tutor.status.slice(1);
                    statusTd.appendChild(statusSpan);
                    tr.appendChild(statusTd);

                    recentTutorsBody.appendChild(tr);
                });
            }

        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    updateStats();
});
