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


## Upload flow

When a new image is selected or dropped, the editor immediately starts AI background removal. The image is displayed on the transparent checkerboard canvas after the AI result is ready, and the processed version is saved to Recent Images. The AI model resources are explicitly pointed at the jsDelivr package path for static GitHub Pages deployment.


## AI model loading

The browser AI remover uses the documented IMG.LY model-data host:
`https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/`

The app uses CPU execution for broader browser compatibility on GitHub Pages. The first removal can take a while because model/WASM assets are downloaded and cached by the browser. IMG.LY documents `publicPath`, model choices, output format, and first-run model loading in its package documentation.


## Fast AI mode

Background removal now uses IMG.LY's `isnet_quint8` small quantized model (about 40 MB) instead of the medium model (about 80 MB), downsizes AI input to a maximum 1280px side, and tries WebGPU first with CPU fallback. The package documentation lists `isnet_quint8` as the small model and notes that first-run downloads are cached. This reduces download and inference time, but browser hardware and network speed still affect actual timing.


## Recent image behavior

Recent tiles now open the **latest processed image**. A tile cannot be opened while AI background removal is running, so the original upload is never reopened and processed again by mistake. The center preview uses a tight, responsive canvas so the image fits without an artificial fixed-height empty area.


## Remove.bg-inspired editor UI

The interface now uses a clean upload landing screen and a compact editor with Cutout, Background, Effects, Adjust, Design, undo/redo, Download, centered checkerboard canvas, and bottom recent thumbnails. The design is an original implementation inspired by common background-removal editor workflows.


## Upload flow

Dropping/selecting an image on the first screen immediately switches to the editor and hides the landing/upload screen. The center canvas is the new drop target: a new JPG/PNG/WEBP can be dropped directly over the current image, replacing it and starting the same automatic processing flow. The canvas is sized from the actual image dimensions and only scales down when necessary to fit the available viewport, so there is no artificial fixed-height image area.


## Fastest background-removal mode

The small quantized `isnet_quint8` model is used with a maximum 1024px AI input. The app also warms the model in the browser during idle time after page load, so the model download/initialization happens before the user uploads an image when possible. WebGPU is attempted first with CPU fallback. This reduces perceived upload-to-result latency; actual speed still depends on device/browser/network.


## Final flow updates

Zoom controls are now placed directly beside the Enhance controls. The Enhance flow preserves the pre-enhancement image and provides a Before/After comparison so the user can see the difference. First-page drag & drop is bound to the upload card, landing page, and document to prevent browser navigation and reliably load dropped image files.


## GitHub Pages compatibility

The browser AI remover is configured for CPU + single-thread WASM. WebGPU is intentionally not requested because ordinary GitHub Pages is not cross-origin isolated and many browsers/devices have no WebGPU adapter. This removes the `No available adapters` and `env.wasm.numThreads` warnings while keeping the background remover functional. The small quantized model and 1024px input remain enabled for speed.
