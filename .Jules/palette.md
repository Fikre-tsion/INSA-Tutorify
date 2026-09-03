## 2025-09-03 - Fullstack Integration and ARIA Navigation Improvements
**Learning:** Adding screen-reader accessibility labels (`.sr-only`) requires ensuring the helper class CSS properties (`position: absolute; width: 1px; height: 1px; margin: -1px; clip: rect(0,0,0,0); overflow: hidden;`) exist in the page context to prevent labels from breaking layout flow.
**Action:** Always verify `.sr-only` CSS definition is imported or declared when adding accessible form labels.
