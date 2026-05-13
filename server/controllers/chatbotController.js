const db = require('../models/db');
const UserService = require('../services/userService');
const fs = require('fs').promises;
const path = require('path');

const SEARCH_INDEX_PATH = path.join(__dirname, '../data/search_index.json');

// Simple keyword-based intent detection and retrieval
const chatbotController = {
    async handleChat(req, res) {
        const { query, lang, history, userId } = req.body;

        if (!query) {
            return res.status(400).json({ message: 'Query is required' });
        }

        try {
            // 1. Get Knowledge Base (Search Index)
            let knowledgeBase;
            try {
                const indexData = await fs.readFile(SEARCH_INDEX_PATH, 'utf8');
                knowledgeBase = JSON.parse(indexData);
            } catch (e) {
                knowledgeBase = await getKnowledgeBaseFromDB();
            }

            // 1.5 Get User Info for personalization
            let userInfo = null;
            if (userId) {
                userInfo = UserService.getUserById(userId);
            }

            // 2. Simple matching logic (Foundation for future LLM integration)
            const answer = findAnswer(query.toLowerCase(), knowledgeBase, lang || 'en', userInfo);

            res.json({ answer });
        } catch (error) {
            console.error('Chat controller error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};

async function getKnowledgeBaseFromDB() {
    const data = db.readDB();

    // Supplement with static content if needed
    // In a real RAG system, we'd use embeddings and a vector DB here.
    return {
        courses: data.courses || [],
        categories: [...new Set((data.courses || []).map(c => c.category))],
        siteInfo: {
            name: "Tutorify",
            description: "An online learning platform offering various courses.",
            contact: "support@tutorify.com"
        }
    };
}

function findAnswer(query, kb, lang, user = null) {
    const name = user ? (user.nickname || user.name) : '';
    const greeting = name ? `Hello ${name}!` : "Hello!";
    const interestMsg = (user && user.interests && user.interests.length > 0)
        ? ` Since you're interested in ${user.interests.join(', ')}, I highly recommend checking out our latest courses in those fields.`
        : "";

    // Duolingo-style "funny/unhinged" interjections
    const personality = (user && user.streak === 0)
        ? " By the way, your 0-day streak is making me very sad. If you don't start a lesson soon, I might have to haunt your dreams. 🦉🔪"
        : "";

    // 1. Check for specific Course Match
    const courseMatch = kb.courses.find(c => query.includes(c.title.toLowerCase()) || query.includes(c.category.toLowerCase()));
    if (courseMatch) {
        return `Oh, you're asking about ${courseMatch.title}! It's a fantastic course in ${courseMatch.category}. It currently has ${courseMatch.likes || 0} likes. Want to enroll?`;
    }

    // 2. Search Page Content
    const pageMatch = kb.pages.find(p => p.content.toLowerCase().includes(query));
    if (pageMatch) {
        return `I found something related to that on our ${pageMatch.name.replace('.html', '')} page: "${pageMatch.content.substring(0, 150)}..."`;
    }

    // 3. Rule-based engine (Fallback)
    if (query.includes('hello') || query.includes('hi')) {
        return `${greeting} I'm here to help you find the best courses on Tutorify.${interestMsg} What are you interested in learning today?${personality}`;
    }

    if (query.includes('course') || query.includes('learn') || query.includes('classes')) {
        const courseNames = kb.courses.slice(0, 3).map(c => c.title).join(', ');
        return `We have many great courses including: ${courseNames}. You can browse all of them on our Courses page!`;
    }

    if (query.includes('price') || query.includes('cost') || query.includes('free')) {
        return "Many of our courses are affordable, and some introductory lessons are free. Check the individual course pages for specific pricing.";
    }

    if (query.includes('teacher') || query.includes('teach')) {
        return "Interested in teaching? You can register as a teacher and create your own courses through the Teacher Dashboard!";
    }

    if (query.includes('contact') || query.includes('support')) {
        return `You can reach our support team at ${kb.siteInfo.contact} or through the Contact page.`;
    }

    // Default fallback
    return "That's a great question! I'm still learning about all the specifics of Tutorify. Is there anything else I can help you with regarding our courses or platform?";
}

module.exports = chatbotController;
