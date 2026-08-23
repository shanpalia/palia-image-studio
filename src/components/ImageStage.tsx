/**
 * Palia Image Studio - Center Image Stage & Comparison Viewer
 * By Hafsa Traders
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Columns, 
  SplitSquareVertical, 
  Eye, 
  Move,
  RotateCw
} from 'lucide-react';
import { EditorState, ViewMode } from '../types';

interface ImageStageProps {
  state: EditorState;
  onSetViewMode: (mode: ViewMode) => void;
  onZoom: (delta: number) => void;
  onFitScreen: () => void;
  onUpdateSliderPos: (pos: number) => void;
}

export const ImageStage: React.FC<ImageStageProps> = ({
  state,
  onSetViewMode,
  onZoom,
  onFitScreen,
  onUpdateSliderPos,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const activeDisplayUrl = state.currentOutputUrl || state.cutoutUrl || state.originalUrl;
  const originalDisplayUrl = state.originalUrl;

  // Handle slider dragging
  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clampedPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    onUpdateSliderPos(clampedPercent);
  }, [onUpdateSliderPos]);

  const handlePointerDownSlider = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingSlider(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveSlider = (e: React.PointerEvent) => {
    if (isDraggingSlider) {
      handleSliderMove(e.clientX);
    }
  };

  const handlePointerUpSlider = (e: React.PointerEvent) => {
    if (isDraggingSlider) {
      setIsDraggingSlider(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Handle Canvas Pan when Zoomed
  const handleMouseDownStage = (e: React.MouseEvent) => {
    if (state.zoom > 1 && !isDraggingSlider) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMoveStage = (e: React.MouseEvent) => {
    if (isPanning && state.zoom > 1) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUpStage = () => {
    setIsPanning(false);
  };

  // Reset pan when fit screen or zoom <= 1
  useEffect(() => {
    if (state.zoom <= 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [state.zoom]);

  // Dynamic background style based on state
  const getStageBackgroundStyle = () => {
    if (state.bgType === 'white') {
      return { backgroundColor: '#FFFFFF' };
    }
    if (state.bgType === 'black') {
      return { backgroundColor: '#000000' };
    }
    if (state.bgType === 'custom' && state.customBgColor) {
      return { backgroundColor: state.customBgColor };
    }
    // Transparent checkerboard
    return {};
  };

  const isTransparent = state.bgType === 'transparent';

  return (
    <div id="image-stage-wrapper" className="w-full flex flex-col gap-3">
      {/* Top View Mode Bar & Zoom Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            id="view-mode-single-btn"
            type="button"
            onClick={() => onSetViewMode('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              state.viewMode === 'preview'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Single View</span>
          </button>

          <button
            id="view-mode-slider-btn"
            type="button"
            onClick={() => onSetViewMode('slider')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              state.viewMode === 'slider'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Before / After Slider</span>
          </button>

          <button
            id="view-mode-side-by-side-btn"
            type="button"
            onClick={() => onSetViewMode('side-by-side')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              state.viewMode === 'side-by-side'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            id="zoom-out-btn"
            type="button"
            onClick={() => onZoom(-0.25)}
            disabled={state.zoom <= 0.25}
            title="Zoom Out"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-medium text-slate-600 px-2 min-w-14 text-center">
            {Math.round(state.zoom * 100)}%
          </span>

          <button
            id="zoom-in-btn"
            type="button"
            onClick={() => onZoom(0.25)}
            disabled={state.zoom >= 3.0}
            title="Zoom In"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            id="fit-screen-btn"
            type="button"
            onClick={onFitScreen}
            title="Fit to Screen"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 ml-1"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Display Stage */}
      <div
        id="image-stage-viewport"
        ref={containerRef}
        onMouseDown={handleMouseDownStage}
        onMouseMove={handleMouseMoveStage}
        onMouseUp={handleMouseUpStage}
        onMouseLeave={handleMouseUpStage}
        className={`relative w-full h-[460px] sm:h-[560px] lg:h-[620px] rounded-3xl border border-slate-200 shadow-inner overflow-hidden flex items-center justify-center select-none ${
          state.zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        } ${isTransparent ? 'checkerboard-pattern bg-slate-100' : ''}`}
        style={getStageBackgroundStyle()}
      >
        {/* Render View Mode: 1. Single Preview */}
        {state.viewMode === 'preview' && (
          <div
            className="relative transition-transform duration-75 flex items-center justify-center max-w-full max-h-full p-4"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${state.zoom})`,
            }}
          >
            {activeDisplayUrl && (
              <img
                id="active-preview-image"
                src={activeDisplayUrl}
                alt="Processed result"
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[500px] sm:max-h-[560px] object-contain drop-shadow-md rounded-lg"
                style={{
                  transform: `rotate(${state.rotation}deg) scaleX(${state.flipH ? -1 : 1}) scaleY(${state.flipV ? -1 : 1})`,
                }}
              />
            )}
            
            {/* Status indicator tag */}
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1 rounded-full shadow-lg pointer-events-none">
              {state.hasBgRemoved ? 'Background Removed' : 'Original Subject'} • {state.enhanceScale}× Scale
            </div>
          </div>
        )}

        {/* Render View Mode: 2. Slider Comparison */}
        {state.viewMode === 'slider' && (
          <div
            className="relative w-full h-full flex items-center justify-center p-4 overflow-hidden"
            onPointerMove={handlePointerMoveSlider}
            onPointerUp={handlePointerUpSlider}
          >
            <div
              className="relative max-w-full max-h-full flex items-center justify-center"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${state.zoom})`,
              }}
            >
              {/* Processed (Right Side / Full Base) */}
              {activeDisplayUrl && (
                <img
                  id="slider-processed-image"
                  src={activeDisplayUrl}
                  alt="Processed image"
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[480px] sm:max-h-[540px] object-contain block"
                  style={{
                    transform: `rotate(${state.rotation}deg) scaleX(${state.flipH ? -1 : 1}) scaleY(${state.flipV ? -1 : 1})`,
                  }}
                />
              )}

              {/* Original (Left Side / Clipped via polygon) */}
              {originalDisplayUrl && (
                <div
                  className="absolute inset-0 overflow-hidden flex items-center justify-center"
                  style={{
                    clipPath: `polygon(0 0, ${state.sliderPos}% 0, ${state.sliderPos}% 100%, 0 100%)`,
                  }}
                >
                  <img
                    id="slider-original-image"
                    src={originalDisplayUrl}
                    alt="Original image"
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-[480px] sm:max-h-[540px] object-contain block"
                    style={{
                      transform: `rotate(${state.rotation}deg) scaleX(${state.flipH ? -1 : 1}) scaleY(${state.flipV ? -1 : 1})`,
                    }}
                  />
                </div>
              )}

              {/* Draggable Divider Line & Knob */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl cursor-ew-resize z-20 flex items-center justify-center pointer-events-auto"
                style={{ left: `${state.sliderPos}%` }}
                onPointerDown={handlePointerDownSlider}
              >
                <div className="w-8 h-8 rounded-full bg-white text-slate-800 shadow-xl border-2 border-indigo-600 flex items-center justify-center text-xs font-bold -ml-4 hover:scale-110 active:scale-95 transition-transform">
                  ⇄
                </div>
              </div>

              {/* Before & After Labels */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md pointer-events-none z-10">
                Original
              </div>
              <div className="absolute top-3 right-3 bg-indigo-600/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md pointer-events-none z-10">
                Processed
              </div>
            </div>
          </div>
        )}

        {/* Render View Mode: 3. Side-by-Side */}
        {state.viewMode === 'side-by-side' && (
          <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 overflow-auto">
            {/* Original Card */}
            <div className="relative bg-slate-900/5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-3 overflow-hidden">
              <span className="absolute top-3 left-3 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md z-10">
                Original Image
              </span>
              {originalDisplayUrl && (
                <img
                  id="side-original-image"
                  src={originalDisplayUrl}
                  alt="Original"
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[380px] object-contain rounded-lg shadow-sm"
                  style={{
                    transform: `rotate(${state.rotation}deg) scaleX(${state.flipH ? -1 : 1}) scaleY(${state.flipV ? -1 : 1})`,
                  }}
                />
              )}
              <div className="text-[11px] text-slate-500 mt-2 font-mono">
                {state.originalDimensions.width} × {state.originalDimensions.height} px
              </div>
            </div>

            {/* Processed Card */}
            <div className="relative bg-slate-900/5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-3 overflow-hidden">
              <span className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md z-10">
                Processed Studio Output
              </span>
              {activeDisplayUrl && (
                <img
                  id="side-processed-image"
                  src={activeDisplayUrl}
                  alt="Processed"
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[380px] object-contain rounded-lg shadow-md"
                  style={{
                    transform: `rotate(${state.rotation}deg) scaleX(${state.flipH ? -1 : 1}) scaleY(${state.flipV ? -1 : 1})`,
                  }}
                />
              )}
              <div className="text-[11px] text-indigo-600 font-semibold mt-2 font-mono">
                {state.currentDimensions.width} × {state.currentDimensions.height} px ({state.enhanceScale}×)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
