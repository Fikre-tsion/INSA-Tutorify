## 2026-09-19 - Fullstack Integration & Image Path Resolution
**Learning:** Relative image paths in client-side scripts like `dashboard.js` must match the root directory asset location (`./digitalmarketing.png` vs `./images/...`) to prevent broken image placeholders in dashboard cards and user tables.
**Action:** Always verify asset file existence in root or subdirectory before hardcoding fallback image paths in dynamic UI rendering.
