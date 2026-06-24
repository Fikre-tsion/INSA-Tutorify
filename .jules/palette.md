## 2025-05-22 - [Hybrid Dynamic Rendering]
**Learning:** Transitioning a static site to full dynamic rendering without fallbacks negatively impacts SEO and UX for users with slow connections. Static placeholders ensure the site remains functional and readable while live data is being fetched.
**Action:** Always include at least one static sample or a robust skeleton state when moving to API-driven content.

## 2025-05-22 - [Accessibility Utility Consistency]
**Learning:** Using accessibility classes like `.sr-only` requires ensuring they are either defined globally or duplicated in standalone pages that don't share the main stylesheet to prevent broken layouts for non-screen-reader users.
**Action:** Verify CSS availability for all utility classes used in new components.
