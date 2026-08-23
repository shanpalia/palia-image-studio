/**
 * Palia Image Studio - Image Composition & Export Engine
 * By Hafsa Traders
 */

import { BgType, ImageDimensions } from '../types';

export interface CompositeOptions {
  foregroundSource: Blob | File | string;
  bgType: BgType;
  customBgColor: string;
  rotation?: number; // 0, 90, 180, 270
  flipH?: boolean;
  flipV?: boolean;
}

export interface ExportOptions {
  format: 'png' | 'jpg';
  quality?: number;
  bgType: BgType;
  customBgColor: string;
  rotation?: number;
  flipH?: boolean;
  flipV?: boolean;
}

/**
 * Composites the image with background color and transforms into an HTMLCanvasElement
 */
export async function renderCompositedCanvas(
  source: Blob | File | string,
  options: {
    bgType: BgType;
    customBgColor: string;
    rotation?: number;
    flipH?: boolean;
    flipV?: boolean;
    forceOpaqueForJpg?: boolean;
  }
): Promise<{ canvas: HTMLCanvasElement; dimensions: ImageDimensions }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const url = typeof source === 'string' ? source : URL.createObjectURL(source);

    img.onload = () => {
      try {
        const origW = img.naturalWidth;
        const origH = img.naturalHeight;

        const rotation = (options.rotation || 0) % 360;
        const isSwapped = rotation === 90 || rotation === 270;

        const targetW = isSwapped ? origH : origW;
        const targetH = isSwapped ? origW : origH;

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          throw new Error('Could not get canvas 2D context');
        }

        // Fill background if not transparent (or if JPG requires solid background)
        const effectiveBgType = options.forceOpaqueForJpg && options.bgType === 'transparent' ? 'white' : options.bgType;

        if (effectiveBgType === 'white') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetW, targetH);
        } else if (effectiveBgType === 'black') {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, targetW, targetH);
        } else if (effectiveBgType === 'custom' && options.customBgColor) {
          ctx.fillStyle = options.customBgColor;
          ctx.fillRect(0, 0, targetW, targetH);
        } else {
          // Transparent: clearRect is already transparent
          ctx.clearRect(0, 0, targetW, targetH);
        }

        // Apply transformations
        ctx.save();
        ctx.translate(targetW / 2, targetH / 2);
        
        if (rotation !== 0) {
          ctx.rotate((rotation * Math.PI) / 180);
        }
        
        const scaleX = options.flipH ? -1 : 1;
        const scaleY = options.flipV ? -1 : 1;
        if (options.flipH || options.flipV) {
          ctx.scale(scaleX, scaleY);
        }

        ctx.drawImage(img, -origW / 2, -origH / 2, origW, origH);
        ctx.restore();

        if (typeof source !== 'string') {
          URL.revokeObjectURL(url);
        }

        resolve({ canvas, dimensions: { width: targetW, height: targetH } });
      } catch (err) {
        if (typeof source !== 'string') {
          URL.revokeObjectURL(url);
        }
        reject(err);
      }
    };

    img.onerror = () => {
      if (typeof source !== 'string') {
        URL.revokeObjectURL(url);
      }
      reject(new Error('Failed to load image for composition'));
    };

    img.src = url;
  });
}

/**
 * Exports the composited image as PNG or JPG Blob
 */
export async function exportImageBlob(
  source: Blob | File | string,
  options: ExportOptions
): Promise<{ blob: Blob; filename: string }> {
  const isJpg = options.format === 'jpg';
  const mimeType = isJpg ? 'image/jpeg' : 'image/png';
  const filename = isJpg ? 'palia-image-studio-edited.jpg' : 'palia-image-studio-edited.png';
  const quality = isJpg ? (options.quality ?? 0.95) : 1.0;

  const { canvas } = await renderCompositedCanvas(source, {
    bgType: options.bgType,
    customBgColor: options.customBgColor,
    rotation: options.rotation,
    flipH: options.flipH,
    flipV: options.flipV,
    forceOpaqueForJpg: isJpg,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ blob, filename });
        } else {
          reject(new Error(`Failed to export image as ${options.format.toUpperCase()}`));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Triggers direct browser download without opening any popup or navigating away
 */
export function downloadBlobDirect(blob: Blob, filename: string): void {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup after trigger
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(downloadUrl);
  }, 300);
}
