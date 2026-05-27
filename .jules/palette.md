## 2025-05-14 - Immediate Feedback for External Form Submissions
**Learning:** Even when using external services like Formspree that cause a page redirect, adding a client-side 'submit' listener to provide immediate visual feedback (like changing button text to "Sending...") significantly improves the perceived responsiveness of the interface.
**Action:** Always add a lightweight submission state handler to static forms to manage user expectations before the external transition occurs.
