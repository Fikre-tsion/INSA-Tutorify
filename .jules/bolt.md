## 2025-07-05 - Secure Dynamic Rendering and HTML Validity
**Learning:** Using `innerHTML` to render data from API endpoints introduces significant Stored XSS vulnerabilities if the data is not properly sanitized. Additionally, placing attributes on closing tags (e.g., `</div loading="lazy">`) results in invalid HTML that can break DOM parsing.
**Action:** Always use `textContent` and `createElement` for dynamic data rendering to ensure security. Rigorously verify that all HTML attributes are placed on opening tags during bulk modifications.
