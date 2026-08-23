# Palia Image Studio — By Hafsa Traders

Simple static GitHub Pages image studio.

## Files

- `index.html`
- `style.css`
- `app.js`
- `assets/favicon.svg`

## GitHub Pages

Upload these files to the repository root and enable:

**Settings → Pages → Deploy from a branch → main → /(root)**

No React, Vite, Node.js, or GitHub Actions is required.

## Features

- Image upload and drag/drop
- Local background-processing fallback
- Real canvas upscaling (2× / 4×)
- Transparent/white/black/custom background
- Rotate and zoom
- Before/after view
- PNG/JPG download

For production-quality AI matting, replace the local fallback with a browser AI model or a secure server-side API. Never expose private API keys in this static site.
