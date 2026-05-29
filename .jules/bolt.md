## 2025-05-14 - Initial Performance Review
**Learning:** The application uses synchronous file system operations (fs.readFileSync/writeFileSync) in the backend which blocks the event loop, and the frontend scroll listener is not throttled, potentially causing junk during scroll.
**Action:** Replace sync I/O with async I/O in the backend and implement throttling for the scroll event in the frontend.
