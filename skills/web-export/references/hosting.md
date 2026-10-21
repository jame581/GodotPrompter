# Hosting a Web Export

Reference for `skills/web-export/SKILL.md` — server headers for threaded builds, MIME types, compression, caching, local testing, and trimming the download.

> ← Back to [SKILL.md](../SKILL.md)

---

## Headers a Threaded Build Needs

Only needed when the preset has `variant/thread_support` enabled. A no-threads build runs on any static host with no special configuration.

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

`require-corp` blocks every cross-origin resource that does not opt in — third-party scripts, fonts, images, ad and analytics iframes. Load those from your own origin, or make sure their servers send `Cross-Origin-Resource-Policy: cross-origin`.

### nginx

```nginx
location /game/ {
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Embedder-Policy "require-corp" always;

    # Current nginx mime.types already maps .wasm to application/wasm. Don't add a
    # `types { }` block here: it replaces the whole map and breaks .html and .js.
    gzip_static on;          # Serves index.wasm.gz when present.
    # brotli_static on;      # With the ngx_brotli module.
}
```

### Apache (`.htaccess`)

```apache
<IfModule mod_headers.c>
    Header set Cross-Origin-Opener-Policy "same-origin"
    Header set Cross-Origin-Embedder-Policy "require-corp"
</IfModule>
AddType application/wasm .wasm
```

### Netlify / Cloudflare Pages (`_headers` file in the publish directory)

```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

### GitHub Pages

GitHub Pages cannot set custom headers. Ship a no-threads build, or enable the PWA option with `progressive_web_app/ensure_cross_origin_isolation_headers` so the generated service worker adds the headers (the page reloads once on first visit while the worker installs).

---

## Compression and Caching

The `.wasm` engine binary and the `.pck` are most of the download and compress well.

| File | Serve with | Cache |
|---|---|---|
| `index.wasm` | `Content-Type: application/wasm`, Brotli or gzip | `no-cache` with ETag, or long-lived only if CI versions the filenames — the `.js` and `.wasm` must always match |
| `index.pck` | Brotli or gzip | Short, or version the filename per release |
| `index.html`, `index.js` | Brotli or gzip | Short (`no-cache`), so players pick up new builds |

Precompress at deploy time rather than on every request:

```bash
cd build/web
gzip -k -9 index.wasm index.pck index.js
brotli -k -q 11 index.wasm index.pck index.js
```

If players report the old version after an update, it is almost always a cached `.pck` with a fresh `.html` (or the reverse). Set short cache times on `.html`/`.js`/`.pck`, or have your CI rename the files per release.

---

## Testing Locally

Browsers refuse to run WebAssembly from `file://`, so always serve the folder over HTTP.

- **Editor:** the **Remote Debug → Run in Browser** button exports and starts a local server that already sends COOP/COEP.
- **Any folder:** `python3 -m http.server 8000 --directory build/web` works for **no-threads** builds only (it sends no isolation headers). For threaded builds, Godot's repository ships `platform/web/serve.py`, which adds them.
- **Threaded build, own server:** use a small server that adds the two headers, or test on the real staging host.

Open the browser's developer console when the page is blank — Godot prints its startup errors there, not in the page.

---

## Reducing Download Size

| Step | Effect |
|---|---|
| Use a separate Web preset with **Resources → Export Mode** set to selected scenes/resources, and exclude debug-only folders with `exclude_filter` | Smaller `.pck` |
| Leave `vram_texture_compression/for_mobile` off unless you target phones | Avoids shipping every texture twice |
| Lower the import **Size Limit** on oversized textures; use Lossy (WebP) compression for large UI and background art | Smaller `.pck` and less memory |
| Stream music as Ogg Vorbis at a modest bitrate; keep WAV only for short SFX | Smaller `.pck` |
| Build a custom export template with unused modules disabled (for example `disable_3d=yes` for a 2D game, `disable_advanced_gui=yes`) via SCons | Smaller `.wasm` |
| Serve with Brotli | Typically the biggest single saving on `.wasm` |

Godot's docs page *Optimizing a build for size* lists the SCons flags for custom templates; pair it with `export-pipeline` to build them in CI.
