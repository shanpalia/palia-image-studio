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


## Real AI background removal

The Background Removal button uses `@imgly/background-removal` in the browser with an ONNX neural-network model. The first use downloads the model/WASM assets and can take longer; subsequent uses are normally faster because browser caching is used.

The package is licensed under AGPL-3.0. Review the license and IMG.LY terms before using the site commercially. See the package documentation: https://www.npmjs.com/package/@imgly/background-removal

## Important GitHub Pages note

This is a plain static site. Keep `index.html`, `style.css`, `app.js`, and `assets/` in the repository root. Use GitHub Pages **Deploy from a branch → main → /(root)**.

No `main.tsx`, React, Vite, Node server, or GitHub Actions is required.


### AI input fix

The AI remover receives a real PNG `Blob` generated from the uploaded image. This avoids browser input-type errors and keeps large images within a reasonable processing size before segmentation. The final output remains a transparent PNG.


## Editor additions

Recent image tiles are clickable and reopen each image for editing. The right panel includes brightness, contrast, saturation, blur, and grayscale adjustments. Changes are stored in the current recent-image item until cleared.


## Initial screen
The upload screen is visible on first load. The full editor appears after an image is selected or dropped.
