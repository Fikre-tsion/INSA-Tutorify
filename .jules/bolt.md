## 2025-05-31 - [Async I/O and Write Queue for Performance]
**Learning:** Switching from synchronous `fs` methods to `fs.promises` in a Node.js backend prevents the event loop from being blocked, significantly improving the application's ability to handle concurrent requests. Implementing a promise-based write queue ensures data integrity in a file-based database like `db.json` by serializing writes.
**Action:** Always prefer `fs.promises` for file operations and use a serialization pattern (like a queue) when performing atomic writes to shared resources.

## 2025-05-31 - [CSS Path Regression During Refactoring]
**Learning:** Moving assets (like CSS files) to a subdirectory without updating all HTML references leads to a complete UI breakdown. Static serving in Express must also be explicitly configured or updated to account for new directory structures.
**Action:** When reorganizing files, perform a project-wide search for all references and verify the UI immediately after the change. Ensure `express.static` or specific routes are correctly mapped to new locations.
