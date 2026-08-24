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


## Final drag & drop / WASM fix

- First-page and editor drag/drop are handled by one capture-phase file-drop handler, preventing the browser from opening the dropped image as a new page.
- Duplicate drag/drop listeners were removed to prevent repeated `loadFile()` calls.
- The unsupported `env.wasm.numThreads` configuration was removed. IMG.LY 1.7.0 does not expose that setting in its public Config; the runtime selects its WASM thread count internally. The idle model warm-up was also removed so the console is quiet until background removal is actually used.
- CPU execution and `proxyToWorker:false` are used for reliable GitHub Pages operation.


## Enhance quality

The Enhance action now performs a real canvas upscale with high-quality image smoothing, a multi-pass resize, and a subtle unsharp-mask detail pass. It outputs a larger PNG and visibly improves edge/detail crispness compared with plain scaling. It is not a generative AI super-resolution model; it improves resampling/detail appearance without inventing unsupported image content. Zoom controls are placed directly beside the Enhance tab in the top toolbar.


## Home UI polish

Added two prominent Background Remover / Image Enhancer buttons in the marked top area, enlarged the two tool visuals, and made the Palia Image Studio header/navigation typography bolder and more polished.


## Final home/header update

The two Background Remover and Image Enhancer controls are now placed in the marked center area of the top header. A custom Palia Image Studio SVG logo is used in the header and as the browser favicon/apple-touch icon. The two home tool preview images are enlarged and kept as cover-style cards. The header title and navigation use stronger, more polished typography.


## Separate tool selection

The home page now shows only the selected tool's visual card. Background Remover is selected by default. Clicking Image Enhancer hides the Background Remover card and shows only the Enhancer card; clicking Background Remover does the reverse. The heading, description, upload status, and selected header button update with the same click event.


## Wide selected image

Only the selected tool remains visible, but its preview now expands to the full visual/card width (up to 620px), matching the larger width the two previews previously occupied together.


## Wide preview correction

The selected Background Remover/Image Enhancer preview now spans the full available left-side home content width instead of retaining the old narrow card width. Only the selected image is shown, with a larger 300px desktop preview height.


## Full-fit image

The selected tool preview now uses `object-fit: contain`, so the complete supplied image is visible inside the wide preview area without cropping or cutting off any part of the image.


## Dedicated tool pages

- `index.html` is the dedicated **Background Remover** page. Its editor exposes Cutout + Background tools; upload automatically starts AI background removal.
- `enhance.html` is the dedicated **Image Enhancer** page. Its editor exposes Enhance, Adjust and Effects tools; upload does not remove the background.
- The header provides direct navigation between the two pages.


## Navigation fix

The dedicated Background Remover page is now a valid standalone HTML document. Header buttons use normal anchors, so clicking Background Remover from the Image Enhancer page opens `background-remover.html` correctly. `index.html` remains the Home/tool picker.


## Clean final page isolation

`background-remover.html` is isolated to the Background Remover workflow and contains no Image Enhancer artwork reference. The Home page keeps Background Remover as the first/default option. `enhance.html` is the only dedicated Image Enhancer page.


## Canonical homepage behavior

`index.html` is now the Background Remover homepage by default. It opens directly to the remove.bg-inspired upload landing page; no tool-selection cards are shown before it. The top bar contains exactly two tool choices: Background Remover (active/default) and Image Enhancer. Clicking Image Enhancer opens `enhance.html`. `background-remover.html` is an identical alias of the homepage remover page.

After an image is uploaded or dropped on the homepage, the landing view switches to the Background Remover editor. It does not open the enhancer workflow.


## Final editor transition and backgrounds

When an image is dropped on Background Remover, the complete landing/header UI is hidden and the full-screen editor opens, matching the Enhancer workflow. The selected Background color is applied directly to the canvas background so it is visible immediately and is also included in the downloaded PNG/JPG.


## Complete fixes

- Root homepage keeps Background Remover as the default tool and now visibly includes Image Enhancer in the header.
- Before upload, both tool choices are visible. After upload/editor mode, the header shows Home + only the selected tool.
- PNG/JPG format buttons are present directly in the editor toolbar, including Background Remover, so JPG download is not hidden inside the Enhance panel.
- Background panel expanded to Magic / Photo / Color groups with many presets and Custom.
- Background colors and gradients are rendered into the canvas and therefore export to PNG/JPG.

## Reference-matched editors

- Background Remover keeps a single large center image with the editing tools on the right.
- Image Enhancer uses a side-by-side Original / Enhanced comparison workspace, with the enhancement factor shown and the enhanced result rendered separately so the quality difference is visible.


## Performance fix

The Image Enhancer now uses a capped working resolution, browser-friendly image smoothing, a single lightweight enhancement pass, and a UI yield. It avoids creating huge 4x intermediate canvases that can freeze or hang low-RAM PCs. Enhancement is kept separate from background removal.


## AI Enhance

The Enhancer page now includes an `AI Enhance` option. It uses a fast local smart-enhancement pipeline (clarity, contrast, saturation, brightness and light sharpening) rather than a cloud API, so no API key is required and the page stays responsive on low-RAM PCs. The button is clearly marked Fast.


## Zoom fix

Zoom In/Out/Reset now use a single delegated event handler and scale the editor canvas directly. Ctrl+mouse-wheel over the canvas also zooms. Zoom is clamped from 25% to 400%.


## Real AI enhancement
The enhancer now uses Real-ESRGAN x4v3 through ONNX Runtime Web for learned super-resolution/restoration. The model is loaded from a public Hugging Face model repository on first use; inference is tiled to limit browser memory use.


## True HD restoration update

AI enhancement now uses a verified Real-ESRGAN general-purpose ONNX export, reads the model's actual output name/shape, and applies a lightweight clarity pass after neural restoration. This is intended to make real photographs visibly sharper and higher-detail rather than merely resizing them.

Important: no super-resolution model can perfectly reconstruct information that was completely destroyed by severe blur; it generates plausible restored detail. Real-ESRGAN is designed for practical real-world image restoration/super-resolution. 


## Cutout-style enhancement

The enhancer now has an explicit AI HD Enhance action. It performs neural super-resolution when the local ONNX model can run, followed by a detail-preserving clarity pass. The UI labels the result as AI HD Restoration rather than pretending ordinary resizing is AI restoration.
