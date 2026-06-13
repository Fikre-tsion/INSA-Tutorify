# Bolt's Journal - Critical Learnings Only

## 2025-05-22 - Initial Setup
**Learning:** The application is currently missing its asset structure (CSS/images) and has a synchronous backend that blocks the event loop on every I/O operation.
**Action:** Transitioning to `fs.promises` and implementing a write queue to ensure high performance and data integrity under load.
