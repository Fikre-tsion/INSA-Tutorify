const motivation = {
    quotes: [
        "The only way to learn a new programming language is by writing programs in it. — Dennis Ritchie",
        "Don't stop until you're proud.",
        "Your limitation—it's only your imagination.",
        "Push yourself, because no one else is going to do it for you.",
        "Great things never come from comfort zones.",
        "Success doesn't just find you. You have to go out and get it.",
        "The harder you work for something, the greater you'll feel when you achieve it.",
        "Dream it. Wish it. Do it.",
        "Success is the sum of small efforts, repeated day in and day out.",
        "It’s not about having time, it’s about making time."
    ],

    congratulations: [
        "Amazing work! You're crushing it! 🚀",
        "You're a natural! Keep that momentum going! 🔥",
        "Lesson complete! Your brain just got an upgrade! 🧠✨",
        "Look at you go! One step closer to mastery! 🌟",
        "Boom! Another one down. You're unstoppable! 💥",
        "Outstanding! Your dedication is paying off! 🏆"
    ],

    init() {
        this.injectConfetti();
        this.injectStyles();
    },

    injectConfetti() {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
        document.head.appendChild(script);
    },

    injectStyles() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/motivation.css';
        document.head.appendChild(link);
    },

    getRandomQuote() {
        return this.quotes[Math.floor(Math.random() * this.quotes.length)];
    },

    getRandomCongrats() {
        return this.congratulations[Math.floor(Math.random() * this.congratulations.length)];
    },

    async celebrate() {
        if (window.confetti) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6c63ff', '#ff9f43', '#54a0ff', '#4cd137']
            });
        }

        this.showModal(this.getRandomCongrats(), "Keep up the great work!");
    },

    showModal(title, text) {
        const modal = document.createElement('div');
        modal.className = 'motivation-modal';
        modal.innerHTML = `
            <div class="motivation-modal-content">
                <h2>${title}</h2>
                <p>${text}</p>
                <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">Continue</button>
            </div>
        `;
        document.body.appendChild(modal);
    },

    showEncouragement() {
        const quote = this.getRandomQuote();
        this.showModal("Need a boost?", `"${quote}"`);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => motivation.init());
} else {
    motivation.init();
}

window.motivation = motivation;
