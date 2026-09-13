## 2025-05-20 - Icon-Only Navigation Toggle Buttons Accessibility

**Learning:** In static multi-page HTML sites, icon-only buttons (like mobile hamburger menu toggles `#open-menu-btn` and `#close-menu-btn`) are often defined without inner text or `aria-label` attributes across multiple pages. Without explicit accessible names, screen readers announce these controls as unlabelled buttons, severely degrading mobile accessibility.
**Action:** Always ensure icon-only buttons include descriptive `aria-label` attributes (e.g., `aria-label="Open menu"`) consistently across all HTML layout files.
