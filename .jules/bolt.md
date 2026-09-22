## 2025-05-18 - Express 4 Async Error Handling & Non-blocking I/O

**Learning:** Express 4 does not automatically handle rejected promises from `async` route handlers. When refactoring blocking synchronous database I/O (`readFileSync`/`writeFileSync`) to asynchronous `fs.promises` with in-memory caching, route handlers must explicitly catch errors and forward them via `next(error)` to prevent HTTP requests from hanging on I/O failures.

**Action:** Always wrap `async` route handlers in `try/catch` blocks or use an `async` error wrapper middleware in Express 4 applications when introducing `await` for disk I/O operations.
