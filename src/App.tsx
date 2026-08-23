/**
 * Palia Image Studio
 * By Hafsa Traders
 * Production-ready AI Image Editor & Background Remover
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { UploadDropzone } from './components/UploadDropzone';
import { EditorToolbar } from './components/EditorToolbar';
import { ImageStage } from './components/ImageStage';
import { ExportPanel } from './components/ExportPanel';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { HowItWorksModal } from './components/HowItWorksModal';
import { AboutModal } from './components/AboutModal';
import { SampleImageItem } from './data/sampleImages';
import { 
  EditorState, 
  ProcessingState, 
  BgType, 
  EnhanceScale, 
  ViewMode, 
  HistorySnapshot 
} from './types';
import { processBackgroundRemoval } from './utils/backgroundRemoval';
import { enhanceImage } from './utils/imageEnhance';
import { exportImageBlob, downloadBlobDirect, renderCompositedCanvas } from './utils/imageComposition';

const INITIAL_PROCESSING_STATE: ProcessingState = {
  isProcessing: false,
  stage: 'idle',
  stageLabel: '',
  progress: 0,
  detail: '',
  error: null,
};

const INITIAL_EDITOR_STATE: EditorState = {
  originalFile: null,
  originalUrl: null,
  originalDimensions: { width: 0, height: 0 },
  originalSize: 0,
  
  cutoutBlob: null,
  cutoutUrl: null,
  
  enhancedBlob: null,
  enhancedUrl: null,
  enhancedDimensions: { width: 0, height: 0 },
  enhanceScale: 1,
  
  currentOutputUrl: null,
  currentBlob: null,
  currentDimensions: { width: 0, height: 0 },
  
  hasBgRemoved: false,
  bgType: 'transparent',
  customBgColor: '#4F46E5',
  
  rotation: 0,
  flipH: false,
  flipV: false,
  
  zoom: 1,
  pan: { x: 0, y: 0 },
  viewMode: 'preview',
  sliderPos: 50,
};

export default function App() {
  const [editorState, setEditorState] = useState<EditorState>(INITIAL_EDITOR_STATE);
  const [processingStatus, setProcessingStatus] = useState<ProcessingState>(INITIAL_PROCESSING_STATE);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Undo / Redo History Stack
  const [historyStack, setHistoryStack] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isApplyingHistoryRef = useRef(false);

  // Record history snapshot when key state changes
  const recordHistory = useCallback((state: EditorState) => {
    if (isApplyingHistoryRef.current) return;

    const snapshot: HistorySnapshot = {
      hasBgRemoved: state.hasBgRemoved,
      bgType: state.bgType,
      customBgColor: state.customBgColor,
      enhanceScale: state.enhanceScale,
      rotation: state.rotation,
      flipH: state.flipH,
      flipV: state.flipV,
    };

    setHistoryStack((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, snapshot];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Load a file into editor
  const handleLoadFile = useCallback((file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
      const newState: EditorState = {
        ...INITIAL_EDITOR_STATE,
        originalFile: file,
        originalUrl: objectUrl,
        originalDimensions: dimensions,
        originalSize: file.size,
        currentOutputUrl: objectUrl,
        currentDimensions: dimensions,
      };

      setEditorState(newState);
      setHistoryStack([]);
      setHistoryIndex(-1);
      setProcessingStatus(INITIAL_PROCESSING_STATE);
    };

    img.onerror = () => {
      setProcessingStatus({
        isProcessing: false,
        stage: 'error',
        stageLabel: 'Load Error',
        progress: 0,
        detail: '',
        error: 'Unable to parse this image file. Please try another image.',
      });
    };

    img.src = objectUrl;
  }, []);

  // Load a curated sample image
  const handleLoadSample = useCallback(async (sample: SampleImageItem) => {
    try {
      setProcessingStatus({
        isProcessing: true,
        stage: 'preparing',
        stageLabel: 'Fetching sample image...',
        progress: 20,
        detail: `Downloading ${sample.title} demo asset...`,
        error: null,
      });

      const response = await fetch(sample.url, { mode: 'cors' });
      if (!response.ok) throw new Error('Sample fetch failed');
      const blob = await response.blob();
      const file = new File([blob], `${sample.id}.jpg`, { type: 'image/jpeg' });
      handleLoadFile(file);
      setProcessingStatus(INITIAL_PROCESSING_STATE);
    } catch (err) {
      console.warn('Direct fetch failed, fallback to image element', err);
      // Fallback via Image constructor
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `${sample.id}.jpg`, { type: 'image/jpeg' });
              handleLoadFile(file);
            }
          }, 'image/jpeg', 0.9);
        }
        setProcessingStatus(INITIAL_PROCESSING_STATE);
      };
      img.onerror = () => {
        setProcessingStatus({
          isProcessing: false,
          stage: 'error',
          stageLabel: 'Network Error',
          progress: 0,
          detail: '',
          error: 'Unable to load the online sample image. Please upload a local image file.',
        });
      };
      img.src = sample.url;
    }
  }, [handleLoadFile]);

  // Execute Background Removal
  const handleRemoveBackground = useCallback(async () => {
    if (!editorState.originalUrl && !editorState.originalFile) return;

    try {
      setProcessingStatus({
        isProcessing: true,
        stage: 'preparing',
        stageLabel: 'Preparing image...',
        progress: 10,
        detail: 'Initializing browser segmentation neural network...',
        error: null,
      });

      // Prefer enhanced image if available, else original
      const source = editorState.enhancedBlob || editorState.originalFile || editorState.originalUrl!;

      const cutoutBlob = await processBackgroundRemoval(source, (stage, progress, detail) => {
        let label = 'Processing image...';
        if (stage === 'preparing') label = 'Preparing image...';
        if (stage === 'removing_bg') label = 'Removing background...';
        if (stage === 'finalizing') label = 'Finalizing...';
        if (stage === 'completed') label = 'Background Removed';

        setProcessingStatus((prev) => ({
          ...prev,
          isProcessing: stage !== 'completed',
          stage,
          stageLabel: label,
          progress,
          detail,
        }));
      });

      const cutoutUrl = URL.createObjectURL(cutoutBlob);

      setEditorState((prev) => {
        const nextState = {
          ...prev,
          cutoutBlob,
          cutoutUrl,
          hasBgRemoved: true,
          currentBlob: cutoutBlob,
          currentOutputUrl: cutoutUrl,
          // Switch to slider view automatically so the user can immediately appreciate the result!
          viewMode: prev.viewMode === 'preview' ? ('slider' as ViewMode) : prev.viewMode,
        };
        recordHistory(nextState);
        return nextState;
      });

      setTimeout(() => {
        setProcessingStatus(INITIAL_PROCESSING_STATE);
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error during background removal';
      setProcessingStatus({
        isProcessing: false,
        stage: 'error',
        stageLabel: 'Background Removal Failed',
        progress: 0,
        detail: '',
        error: `Unable to process this image. Please try another image. (${msg})`,
      });
    }
  }, [editorState.originalUrl, editorState.originalFile, editorState.enhancedBlob, recordHistory]);

  // Execute Real Super-Resolution Enhancement
  const handleEnhance = useCallback(async (scale: EnhanceScale) => {
    if (scale === editorState.enhanceScale) return;

    if (scale === 1) {
      // Revert to 1x scale
      setEditorState((prev) => {
        const sourceUrl = prev.hasBgRemoved && prev.cutoutUrl ? prev.cutoutUrl : prev.originalUrl;
        const nextState = {
          ...prev,
          enhanceScale: 1,
          enhancedBlob: null,
          enhancedUrl: null,
          enhancedDimensions: prev.originalDimensions,
          currentDimensions: prev.originalDimensions,
          currentOutputUrl: sourceUrl,
        };
        recordHistory(nextState);
        return nextState;
      });
      return;
    }

    try {
      setProcessingStatus({
        isProcessing: true,
        stage: 'preparing',
        stageLabel: `Enhancing to ${scale}× HD...`,
        progress: 15,
        detail: 'Running super-resolution convolution and edge sharpening...',
        error: null,
      });

      // Target source
      const source = editorState.hasBgRemoved && editorState.cutoutBlob
        ? editorState.cutoutBlob
        : editorState.originalFile || editorState.originalUrl!;

      const result = await enhanceImage(source, scale, (stage, progress, detail) => {
        setProcessingStatus((prev) => ({
          ...prev,
          isProcessing: stage !== 'completed',
          stage,
          stageLabel: `Enhancing Image (${scale}×)...`,
          progress,
          detail,
        }));
      });

      setEditorState((prev) => {
        const nextState = {
          ...prev,
          enhancedBlob: result.blob,
          enhancedUrl: result.url,
          enhancedDimensions: result.dimensions,
          currentDimensions: result.dimensions,
          currentOutputUrl: result.url,
          currentBlob: result.blob,
          enhanceScale: scale,
        };
        recordHistory(nextState);
        return nextState;
      });

      setTimeout(() => {
        setProcessingStatus(INITIAL_PROCESSING_STATE);
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Enhancement failed';
      setProcessingStatus({
        isProcessing: false,
        stage: 'error',
        stageLabel: 'Enhancement Failed',
        progress: 0,
        detail: '',
        error: `Unable to enhance this image. Please try another image. (${msg})`,
      });
    }
  }, [editorState, recordHistory]);

  // Set Background Type
  const handleSetBgType = useCallback((bgType: BgType) => {
    setEditorState((prev) => {
      const nextState = { ...prev, bgType };
      recordHistory(nextState);
      return nextState;
    });
  }, [recordHistory]);

  // Set Custom Color
  const handleSetCustomColor = useCallback((color: string) => {
    setEditorState((prev) => {
      const nextState = { ...prev, bgType: 'custom' as BgType, customBgColor: color };
      recordHistory(nextState);
      return nextState;
    });
  }, [recordHistory]);

  // Rotate
  const handleRotate = useCallback((direction: 'cw' | 'ccw') => {
    setEditorState((prev) => {
      const delta = direction === 'cw' ? 90 : -90;
      const nextRotation = (prev.rotation + delta + 360) % 360;
      const nextState = { ...prev, rotation: nextRotation };
      recordHistory(nextState);
      return nextState;
    });
  }, [recordHistory]);

  // Flip
  const handleFlip = useCallback((direction: 'h' | 'v') => {
    setEditorState((prev) => {
      const nextState = {
        ...prev,
        flipH: direction === 'h' ? !prev.flipH : prev.flipH,
        flipV: direction === 'v' ? !prev.flipV : prev.flipV,
      };
      recordHistory(nextState);
      return nextState;
    });
  }, [recordHistory]);

  // Zoom
  const handleZoom = useCallback((delta: number) => {
    setEditorState((prev) => ({
      ...prev,
      zoom: Math.max(0.25, Math.min(3.0, Math.round((prev.zoom + delta) * 100) / 100)),
    }));
  }, []);

  // Fit screen
  const handleFitScreen = useCallback(() => {
    setEditorState((prev) => ({
      ...prev,
      zoom: 1,
      pan: { x: 0, y: 0 },
    }));
  }, []);

  // View mode
  const handleSetViewMode = useCallback((mode: ViewMode) => {
    setEditorState((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  // Slider position
  const handleUpdateSliderPos = useCallback((pos: number) => {
    setEditorState((prev) => ({ ...prev, sliderPos: pos }));
  }, []);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isApplyingHistoryRef.current = true;
      const targetIndex = historyIndex - 1;
      const targetSnapshot = historyStack[targetIndex];

      setEditorState((prev) => ({
        ...prev,
        hasBgRemoved: targetSnapshot.hasBgRemoved,
        bgType: targetSnapshot.bgType,
        customBgColor: targetSnapshot.customBgColor,
        enhanceScale: targetSnapshot.enhanceScale,
        rotation: targetSnapshot.rotation,
        flipH: targetSnapshot.flipH,
        flipV: targetSnapshot.flipV,
      }));

      setHistoryIndex(targetIndex);
      setTimeout(() => {
        isApplyingHistoryRef.current = false;
      }, 50);
    }
  }, [historyIndex, historyStack]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < historyStack.length - 1) {
      isApplyingHistoryRef.current = true;
      const targetIndex = historyIndex + 1;
      const targetSnapshot = historyStack[targetIndex];

      setEditorState((prev) => ({
        ...prev,
        hasBgRemoved: targetSnapshot.hasBgRemoved,
        bgType: targetSnapshot.bgType,
        customBgColor: targetSnapshot.customBgColor,
        enhanceScale: targetSnapshot.enhanceScale,
        rotation: targetSnapshot.rotation,
        flipH: targetSnapshot.flipH,
        flipV: targetSnapshot.flipV,
      }));

      setHistoryIndex(targetIndex);
      setTimeout(() => {
        isApplyingHistoryRef.current = false;
      }, 50);
    }
  }, [historyIndex, historyStack]);

  // Reset Adjustments
  const handleResetAdjustments = useCallback(() => {
    setEditorState((prev) => {
      const nextState = {
        ...prev,
        rotation: 0,
        flipH: false,
        flipV: false,
        bgType: 'transparent' as BgType,
        zoom: 1,
        pan: { x: 0, y: 0 },
      };
      recordHistory(nextState);
      return nextState;
    });
  }, [recordHistory]);

  // Total Reset (Back to Upload)
  const handleResetAll = useCallback(() => {
    setEditorState(INITIAL_EDITOR_STATE);
    setHistoryStack([]);
    setHistoryIndex(-1);
    setProcessingStatus(INITIAL_PROCESSING_STATE);
  }, []);

  // Download export
  const handleDownload = useCallback(async (format: 'png' | 'jpg') => {
    const activeSource = editorState.hasBgRemoved && editorState.cutoutBlob
      ? editorState.cutoutBlob
      : editorState.enhancedBlob || editorState.originalFile || editorState.originalUrl;

    if (!activeSource) return;

    const { blob, filename } = await exportImageBlob(activeSource, {
      format,
      bgType: editorState.bgType,
      customBgColor: editorState.customBgColor,
      rotation: editorState.rotation,
      flipH: editorState.flipH,
      flipV: editorState.flipV,
    });

    downloadBlobDirect(blob, filename);
  }, [editorState]);

  const hasLoadedImage = Boolean(editorState.originalUrl);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top Application Header */}
      <Header
        hasImage={hasLoadedImage}
        onReset={handleResetAll}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 flex flex-col justify-center">
        {!hasLoadedImage ? (
          /* View 1: Main Upload Screen & Dropzone */
          <UploadDropzone
            onFileSelected={handleLoadFile}
            onSampleSelected={handleLoadSample}
            isProcessing={processingStatus.isProcessing}
          />
        ) : (
          /* View 2: Complete Studio Editor Layout */
          <div id="studio-editor-container" className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left / Tools & Adjustments Column (Desktop: 3 cols, Mobile: order-2) */}
              <div className="lg:col-span-3 order-2 lg:order-1 flex flex-col gap-4">
                <EditorToolbar
                  state={editorState}
                  canUndo={historyIndex > 0}
                  canRedo={historyIndex < historyStack.length - 1}
                  isProcessing={processingStatus.isProcessing}
                  onRemoveBackground={handleRemoveBackground}
                  onEnhance={handleEnhance}
                  onSetBgType={handleSetBgType}
                  onSetCustomColor={handleSetCustomColor}
                  onRotate={handleRotate}
                  onFlip={handleFlip}
                  onZoom={handleZoom}
                  onFitScreen={handleFitScreen}
                  onSetViewMode={handleSetViewMode}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onReset={handleResetAdjustments}
                />
              </div>

              {/* Center / Large Image Preview Stage (Desktop: 6 cols, Mobile: order-1) */}
              <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col gap-4">
                <ImageStage
                  state={editorState}
                  onSetViewMode={handleSetViewMode}
                  onZoom={handleZoom}
                  onFitScreen={handleFitScreen}
                  onUpdateSliderPos={handleUpdateSliderPos}
                />
              </div>

              {/* Right / Export & Specs Column (Desktop: 3 cols, Mobile: order-3) */}
              <div className="lg:col-span-3 order-3 lg:order-3 flex flex-col gap-4">
                <ExportPanel
                  state={editorState}
                  isProcessing={processingStatus.isProcessing}
                  onDownload={handleDownload}
                />
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">Palia Image Studio</span> • Engineered by <span className="font-semibold text-indigo-600">Hafsa Traders</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsHowItWorksOpen(true)} className="hover:text-indigo-600 transition-colors">
              How It Works
            </button>
            <span>•</span>
            <button onClick={() => setIsAboutOpen(true)} className="hover:text-indigo-600 transition-colors">
              GitHub Pages Deployment
            </button>
          </div>
        </div>
      </footer>

      {/* Real Processing Overlay */}
      <ProcessingOverlay
        status={processingStatus}
        onDismissError={() => setProcessingStatus(INITIAL_PROCESSING_STATE)}
        onRetry={handleRemoveBackground}
      />

      {/* Modals */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}
