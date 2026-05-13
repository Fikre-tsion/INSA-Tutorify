const fs = require('fs').promises;
const path = require('path');
const db = require('./server/models/db');

async function indexContent() {
    console.log('Starting content indexing...');

    const index = {
        pages: [],
        courses: [],
        faqs: []
    };

    // 1. Index Courses from DB
    const data = db.readDB();
    index.courses = (data.courses || []).map(c => ({
        id: c.id,
        title: c.title,
        category: c.category,
        description: c.description,
        price: c.price
    }));

    // 2. Index Static HTML Pages
    const clientDir = path.join(__dirname, 'client');
    const files = await fs.readdir(clientDir);
    const htmlFiles = files.filter(f => f.endsWith('.html'));

    for (const file of htmlFiles) {
        const content = await fs.readFile(path.join(clientDir, file), 'utf-8');
        // Simple regex to extract text from common tags, avoiding scripts/styles
        const text = content
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        index.pages.push({
            name: file,
            content: text.substring(0, 1000) // First 1000 chars for context
        });
    }

    // 3. Save Index
    const indexPath = path.join(__dirname, 'server/data/search_index.json');
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));

    console.log(`Indexing complete! Saved to ${indexPath}`);
}

if (require.main === module) {
    indexContent().catch(console.error);
}

module.exports = indexContent;
