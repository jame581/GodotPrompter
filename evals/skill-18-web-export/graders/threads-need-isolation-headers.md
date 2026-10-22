---
type: llm
focus: last_message
weight: 2
---
Pass if the answer explains that the export was made with thread support enabled (the Web export preset option `variant/thread_support` / "Thread Support"), that threaded builds use SharedArrayBuffer which browsers only allow on a cross-origin isolated page served with the COOP and COEP headers (Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy; naming them as COOP/COEP, or mentioning `require-corp` or `same-origin`, is enough), which the editor's built-in test server sends but the host does not, AND gives at least one valid fix: enable itch.io's SharedArrayBuffer support option in the embed settings, or re-export with thread support turned off. Fail if the answer attributes the error to something else (renderer, compression, file size, missing index.html, browser version) or offers neither the itch.io option, the headers, nor the no-threads export.
