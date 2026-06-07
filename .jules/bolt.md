## 2025-01-24 - Initial Performance Audit
**Learning:** The application uses synchronous `fs` methods in `server.js` (`readFileSync`, `writeFileSync`), which block the Node.js event loop and significantly increase latency during concurrent requests. Additionally, the scroll event listener in `main.js` is unthrottled, causing excessive DOM manipulations on every scroll tick.
**Action:** Replace synchronous file I/O with asynchronous `fs.promises` and implement an in-memory cache for data reads. Introduce a throttle function in `main.js` to limit scroll event execution to once every 100ms.
