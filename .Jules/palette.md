## 2026-09-20 - Full-stack API & Micro-UX Integration
**Learning:** Fullstack integration required pairing secure backend defaults (hardcoded 'user' role on registration, JWT authentication on admin routes) with accessible UI affordances (keyboard listeners, focus-visible outlines, aria-labels, loading state indicators) and asynchronous file queues to prevent race conditions during concurrent requests.
**Action:** Always wrap file write operations in a Promise chain queue and maintain clear inline status indicators on async forms for screen readers and keyboard users.
