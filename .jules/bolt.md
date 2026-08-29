## 2026-06-01 - Asynchronous File I/O & In-Memory Read Caching for JSON DB
**Learning:** Synchronous JSON file reads (`fs.readFileSync`) during HTTP request handling block the Node.js event loop, resulting in non-linear latency spikes under concurrent traffic. By caching the parsed database in memory (`dbCache`) and executing non-blocking asynchronous disk writes (`fs.promises.writeFile`), read throughput increases significantly while preserving persistence.
**Action:** Always wrap file-backed JSON database handlers with an in-memory reference cache for reads and `fs.promises` for disk writes.

## 2026-06-01 - Passive Event Listeners for Compositor-Driven Scrolling
**Learning:** Attaching a non-passive `scroll` event listener to `window` causes browser main-thread layout calculation bottlenecks because the browser must wait to see if `preventDefault()` will be called before scrolling.
**Action:** Pass `{ passive: true }` to non-cancelable scroll listeners to enable immediate GPU/compositor thread scrolling.
