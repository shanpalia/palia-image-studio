/**
 * Palia Image Studio - Editor Toolbar & Adjustments Panel
 * By Hafsa Traders
 */

import React from 'react';
import { 
  Sparkles, 
  Zap, 
  RotateCcw, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Columns, 
  SplitSquareVertical, 
  Eye, 
  Layers, 
  Palette,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { BgType, EnhanceScale, ViewMode, EditorState } from '../types';

interface EditorToolbarProps {
  state: EditorState;
  canUndo: boolean;
  canRedo: boolean;
  isProcessing: boolean;
  onRemoveBackground: () => void;
  onEnhance: (scale: EnhanceScale) => void;
  onSetBgType: (bgType: BgType) => void;
  onSetCustomColor: (color: string) => void;
  onRotate: (direction: 'cw' | 'ccw') => void;
  onFlip: (direction: 'h' | 'v') => void;
  onZoom: (delta: number) => void;
  onFitScreen: () => void;
  onSetViewMode: (mode: ViewMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
}

const COLOR_PRESETS = [
  { name: 'Pure White', value: '#FFFFFF' },
  { name: 'Studio Black', value: '#000000' },
  { name: 'Studio Gray', value: '#F1F5F9' },
  { name: 'Soft Charcoal', value: '#1E293B' },
  { name: 'Sky Blue', value: '#E0F2FE' },
  { name: 'Mint Green', value: '#DCFCE7' },
  { name: 'Sunset Peach', value: '#FFEDD5' },
  { name: 'Royal Indigo', value: '#4F46E5' },
];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  state,
  canUndo,
  canRedo,
  isProcessing,
  onRemoveBackground,
  onEnhance,
  onSetBgType,
  onSetCustomColor,
  onRotate,
  onFlip,
  onZoom,
  onFitScreen,
  onSetViewMode,
  onUndo,
  onRedo,
  onReset,
}) => {
  return (
    <div id="editor-toolbar-panel" className="w-full flex flex-col gap-5">
      {/* Primary Action Card: AI Background Removal */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-900">Background Isolation</span>
          </div>
          {state.hasBgRemoved && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Check className="w-3 h-3" />
              Background Removed
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Isolate the primary subject using high-precision in-browser neural segmentation.
        </p>

        <button
          id="remove-bg-main-btn"
          type="button"
          disabled={isProcessing}
          onClick={onRemoveBackground}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-xs ${
            state.hasBgRemoved
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80'
              : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-indigo-500/25'
          } ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Processing Model...</span>
            </>
          ) : state.hasBgRemoved ? (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Re-run Background Removal</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Remove Background</span>
            </>
          )}
        </button>
      </div>

      {/* Enhancement & Super-Resolution */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-900">Enhance Image</span>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            {state.currentDimensions.width} × {state.currentDimensions.height} px
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-3.5">
          Real super-resolution upscaling, unsharp deconvolution & texture sharpening.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {([1, 2, 4] as EnhanceScale[]).map((scale) => {
            const isSelected = state.enhanceScale === scale;
            const targetW = state.originalDimensions.width * scale;
            const targetH = state.originalDimensions.height * scale;
            const mp = ((targetW * targetH) / 1000000).toFixed(1);

            return (
              <button
                key={scale}
                id={`enhance-btn-${scale}x`}
                type="button"
                disabled={isProcessing}
                onClick={() => onEnhance(scale)}
                className={`py-2.5 px-3 rounded-xl text-center border transition-all ${
                  isSelected
                    ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                } ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="text-xs font-bold font-mono">
                  {scale === 1 ? 'Original' : `${scale}× HD`}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {mp} MP
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Background Options */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Palette className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-900">Background Color</span>
        </div>

        <p className="text-xs text-slate-500 mb-3.5">
          Choose a backdrop for the separated foreground subject.
        </p>

        {/* Primary Type Pills */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {/* Transparent */}
          <button
            id="bg-transparent-btn"
            type="button"
            onClick={() => onSetBgType('transparent')}
            className={`py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1.5 transition-all ${
              state.bgType === 'transparent'
                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/20'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="w-5 h-5 rounded-md border border-slate-300 bg-[linear-gradient(45deg,#cbd5e1_25%,transparent_25%),linear-gradient(-45deg,#cbd5e1_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#cbd5e1_75%),linear-gradient(-45deg,transparent_75%,#cbd5e1_75%)] bg-[size:6px_6px] bg-[position:0_0,0_3px,3px_-3px,-3px_0]" />
            <span className="text-[11px] truncate">Transparent</span>
          </button>

          {/* White */}
          <button
            id="bg-white-btn"
            type="button"
            onClick={() => onSetBgType('white')}
            className={`py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1.5 transition-all ${
              state.bgType === 'white'
                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/20'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="w-5 h-5 rounded-md border border-slate-300 bg-white shadow-xs" />
            <span className="text-[11px] truncate">White</span>
          </button>

          {/* Black */}
          <button
            id="bg-black-btn"
            type="button"
            onClick={() => onSetBgType('black')}
            className={`py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1.5 transition-all ${
              state.bgType === 'black'
                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/20'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="w-5 h-5 rounded-md border border-slate-700 bg-black" />
            <span className="text-[11px] truncate">Black</span>
          </button>

          {/* Custom */}
          <button
            id="bg-custom-btn"
            type="button"
            onClick={() => onSetBgType('custom')}
            className={`py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1.5 transition-all ${
              state.bgType === 'custom'
                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/20'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div 
              className="w-5 h-5 rounded-md border border-slate-300 shadow-xs"
              style={{ backgroundColor: state.customBgColor }}
            />
            <span className="text-[11px] truncate">Custom</span>
          </button>
        </div>

        {/* Custom Color Swatches & Native Color Picker */}
        {state.bgType === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Color Palette</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-mono text-indigo-600 hover:text-indigo-800">
                <input
                  type="color"
                  value={state.customBgColor}
                  onChange={(e) => onSetCustomColor(e.target.value)}
                  className="w-5 h-5 rounded border border-slate-300 cursor-pointer p-0"
                />
                <span>{state.customBgColor.toUpperCase()}</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.name}
                  onClick={() => onSetCustomColor(preset.value)}
                  className={`w-6 h-6 rounded-lg border transition-transform hover:scale-110 ${
                    state.customBgColor.toLowerCase() === preset.value.toLowerCase()
                      ? 'ring-2 ring-indigo-600 ring-offset-1 border-indigo-500'
                      : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editing Controls & History Stack */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Image Adjustments & History
        </div>

        <div className="grid grid-cols-4 gap-2 mb-3">
          {/* Undo */}
          <button
            id="undo-btn"
            type="button"
            disabled={!canUndo || isProcessing}
            onClick={onUndo}
            title="Undo recent action"
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Redo */}
          <button
            id="redo-btn"
            type="button"
            disabled={!canRedo || isProcessing}
            onClick={onRedo}
            title="Redo action"
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Rotate CCW */}
          <button
            id="rotate-ccw-btn"
            type="button"
            disabled={isProcessing}
            onClick={() => onRotate('ccw')}
            title="Rotate 90° Left"
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Rotate CW */}
          <button
            id="rotate-cw-btn"
            type="button"
            disabled={isProcessing}
            onClick={() => onRotate('cw')}
            title="Rotate 90° Right"
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Flip H */}
          <button
            id="flip-h-btn"
            type="button"
            disabled={isProcessing}
            onClick={() => onFlip('h')}
            title="Flip Horizontal"
            className={`py-2 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
              state.flipH
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span>Flip H</span>
          </button>

          {/* Flip V */}
          <button
            id="flip-v-btn"
            type="button"
            disabled={isProcessing}
            onClick={() => onFlip('v')}
            title="Flip Vertical"
            className={`py-2 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
              state.flipV
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FlipVertical className="w-3.5 h-3.5" />
            <span>Flip V</span>
          </button>

          {/* Reset All */}
          <button
            id="reset-adjustments-btn"
            type="button"
            disabled={isProcessing}
            onClick={onReset}
            title="Reset All Adjustments"
            className="py-2 px-2 rounded-xl text-xs font-medium border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors flex items-center justify-center gap-1"
          >
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
