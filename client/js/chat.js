const chatbot = {
    isOpen: false,
    messages: [],

    init() {
        this.injectStyles();
        this.render();
        this.bindEvents();
        this.addWelcomeMessage();
    },

    injectStyles() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/chat.css';
        document.head.appendChild(link);
    },

    render() {
        const container = document.createElement('div');
        container.className = 'chatbot-container';
        container.innerHTML = `
            <div class="chatbot-button" id="chatbot-toggle">
                <i class="uil uil-comment-dots"></i>
            </div>
            <div class="chatbot-window" id="chatbot-window">
                <div class="chatbot-header">
                    <h3 data-i18n="chat_title">Tutorify AI Assistant</h3>
                    <div class="chatbot-close" id="chatbot-close">
                        <i class="uil uil-multiply"></i>
                    </div>
                </div>
                <div class="chatbot-messages" id="chatbot-messages"></div>
                <form class="chatbot-input" id="chatbot-form">
                    <input type="text" id="chatbot-input-field" placeholder="Ask a question..." data-i18n="chat_placeholder">
                    <button type="submit">
                        <i class="uil uil-message"></i>
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(container);

        // Re-run i18n to translate newly injected elements
        if (window.i18n) window.i18n.translatePage();
    },

    bindEvents() {
        const toggle = document.getElementById('chatbot-toggle');
        const close = document.getElementById('chatbot-close');
        const windowEl = document.getElementById('chatbot-window');
        const form = document.getElementById('chatbot-form');
        const input = document.getElementById('chatbot-input-field');

        toggle.addEventListener('click', () => {
            this.isOpen = !this.isOpen;
            windowEl.classList.toggle('open', this.isOpen);
            if (this.isOpen) input.focus();
        });

        close.addEventListener('click', () => {
            this.isOpen = false;
            windowEl.classList.remove('open');
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = input.value.trim();
            if (!message) return;

            this.addMessage('user', message);
            input.value = '';

            await this.handleUserQuery(message);
        });
    },

    addWelcomeMessage() {
        const welcome = window.i18n && window.i18n.translations['chat_welcome']
            ? window.i18n.translations['chat_welcome']
            : "Hello! I'm your Tutorify assistant. How can I help you today?";
        this.addMessage('bot', welcome);
    },

    addMessage(role, text) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.messages.push({ role, text });
    },

    async handleUserQuery(query) {
        // Show typing indicator or something?
        // For now just call backend
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await window.api.fetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    query,
                    lang: window.i18n ? window.i18n.currentLang : 'en',
                    userId: user ? user.id : null,
                    history: this.messages.slice(-5) // Send last few messages for context
                })
            });

            this.addMessage('bot', response.answer);
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage('bot', "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.");
        }
    }
};

// Initialize when scripts are loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => chatbot.init());
} else {
    chatbot.init();
}

window.chatbot = chatbot;
