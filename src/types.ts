/**
 * Palia Image Studio - Types & Interfaces
 * By Hafsa Traders
 */

export type BgType = 'transparent' | 'white' | 'black' | 'custom';

export type EnhanceScale = 1 | 2 | 4;

export type ViewMode = 'preview' | 'slider' | 'side-by-side';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ProcessingState {
  isProcessing: boolean;
  stage: 'idle' | 'preparing' | 'removing_bg' | 'enhancing' | 'finalizing' | 'completed' | 'error';
  stageLabel: string;
  progress: number; // 0 to 100
  detail: string;
  error: string | null;
}

export interface EditorState {
  originalFile: File | null;
  originalUrl: string | null;
  originalDimensions: ImageDimensions;
  originalSize: number; // in bytes
  
  // Cutout with transparent background (result of AI segmentation)
  cutoutBlob: Blob | null;
  cutoutUrl: string | null;
  
  // Enhanced/Upscaled source
  enhancedBlob: Blob | null;
  enhancedUrl: string | null;
  enhancedDimensions: ImageDimensions;
  enhanceScale: EnhanceScale;
  
  // Active composited output
  currentOutputUrl: string | null;
  currentBlob: Blob | null;
  currentDimensions: ImageDimensions;
  
  // Customization
  hasBgRemoved: boolean;
  bgType: BgType;
  customBgColor: string;
  
  // Transforms
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  
  // View controls
  zoom: number; // 0.1 to 5.0
  pan: { x: number; y: number };
  viewMode: ViewMode;
  sliderPos: number; // 0 to 100
}

export interface HistorySnapshot {
  hasBgRemoved: boolean;
  bgType: BgType;
  customBgColor: string;
  enhanceScale: EnhanceScale;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}
