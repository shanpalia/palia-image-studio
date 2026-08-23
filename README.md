# Palia Image Studio
### By Hafsa Traders

A high-performance, privacy-focused image editing web application engineered to run 100% inside the browser using WebAssembly neural segmentation and super-resolution canvas algorithms. Compatible with GitHub Pages static hosting.

---

## 🌟 Key Features

1. **Neural AI Background Removal**: Real in-browser foreground isolation via WebAssembly and ONNX Runtime. Separates people, products, clothing, and vehicles with sub-pixel alpha boundary precision.
2. **2× & 4× Super-Resolution Enhancement**: Real multi-pass detail reconstruction, unsharp deconvolution, Laplacian edge-frequency synthesis, and adaptive local contrast optimization.
3. **Interactive Comparison Viewer**: Real-time Before/After draggable split slider, Side-by-Side synchronized comparison, and Single View modes.
4. **Studio Backdrop Customization**: Live preview and rendering for Transparent (checkerboard pattern), Pure White, Studio Black, and Custom Hex Color swatches.
5. **Editing Controls**: Undo/Redo history stack, 90° CCW/CW rotation, Horizontal/Vertical flipping, Zoom In/Out, and Pan navigation.
6. **Lossless Direct Export**:
   - **PNG**: Preserves transparent alpha channel with maximum clarity.
   - **JPG**: Studio-grade solid background composition with 95% quality.
   - Direct download with default filenames `palia-image-studio-edited.png` and `palia-image-studio-edited.jpg`.
7. **100% On-Device Privacy**: No images are uploaded to any external server. All computations happen on the client CPU/GPU.

---

## 🚀 Live Demo & GitHub Pages Deployment

This application is built with Vite, React 18, and Tailwind CSS with a relative base configuration (`base: './'`), making it ready for instant deployment on GitHub Pages.

### Option 1: Automatic GitHub Actions Deployment (Recommended)

1. Push this repository to GitHub.
2. In your repository settings, navigate to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Palia Image Studio to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Build Static Production Assets
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Option 2: Deploy using `gh-pages` CLI

```bash
# 1. Install gh-pages
npm install --save-dev gh-pages

# 2. Build the static production bundle
npm run build

# 3. Deploy the dist directory to gh-pages branch
npx gh-pages -d dist
```

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/palia-image-studio.git
cd palia-image-studio

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser at http://localhost:3000
```

---

## 🧠 AI Model Architecture

- **Segmentation**: Powered by `@imgly/background-removal` utilizing ONNX Runtime Web and WebAssembly. Model weights are downloaded and cached in the browser's CacheStorage/IndexedDB after the initial warm-up.
- **Fallback Saliency Matting**: A built-in high-precision Canvas boundary luminance flood algorithm executes seamlessly if WebGPU/WASM memory is constrained on older mobile hardware.
- **Super-Resolution Engine**: 
  - Dual-stage bicubic resampling
  - 3x3 Unsharp Mask convolution kernel
  - Laplacian high-frequency edge synthesis
  - Dynamic local contrast mapping

---

## 🔒 Privacy Guarantee

- **Zero Cloud Storage**: User photos are processed entirely within the browser sandbox.
- **No Telemetry / No Tracking**: No image telemetry or analytics are collected.

---

## 🏢 Credits

**Palia Image Studio**
Engineered by **Hafsa Traders**
All rights reserved.
