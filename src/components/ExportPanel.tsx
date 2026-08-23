/**
 * Palia Image Studio - Export & Download Panel
 * By Hafsa Traders
 */

import React, { useState } from 'react';
import { 
  Download, 
  FileImage, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Info,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EditorState } from '../types';

interface ExportPanelProps {
  state: EditorState;
  isProcessing: boolean;
  onDownload: (format: 'png' | 'jpg') => Promise<void>;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  state,
  isProcessing,
  onDownload,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'png' | 'jpg'>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadClick = async () => {
    try {
      setIsExporting(true);
      await onDownload(selectedFormat);

      // Trigger celebratory confetti
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Export download failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const megapixel = (
    (state.currentDimensions.width * state.currentDimensions.height) /
    1000000
  ).toFixed(2);

  return (
    <div id="export-panel" className="w-full flex flex-col gap-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Download className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Export & Download</h2>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Studio Grade
        </span>
      </div>

      {/* Format Selection Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* PNG */}
        <button
          id="export-format-png-btn"
          type="button"
          onClick={() => setSelectedFormat('png')}
          className={`p-3 rounded-xl border text-left transition-all relative ${
            selectedFormat === 'png'
              ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
              : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
          }`}
        >
          {selectedFormat === 'png' && (
            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <Check className="w-3 h-3" />
            </div>
          )}
          <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 font-mono">
            <span>PNG</span>
            <span className="text-[10px] text-indigo-600 font-sans font-medium px-1.5 py-0.2 rounded bg-indigo-100/60">
              Alpha
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Preserves transparent backdrop with maximum clarity.
          </p>
        </button>

        {/* JPG */}
        <button
          id="export-format-jpg-btn"
          type="button"
          onClick={() => setSelectedFormat('jpg')}
          className={`p-3 rounded-xl border text-left transition-all relative ${
            selectedFormat === 'jpg'
              ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
              : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
          }`}
        >
          {selectedFormat === 'jpg' && (
            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <Check className="w-3 h-3" />
            </div>
          )}
          <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 font-mono">
            <span>JPG</span>
            <span className="text-[10px] text-slate-600 font-sans font-medium px-1.5 py-0.2 rounded bg-slate-200/60">
              Compact
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            High quality solid background for web & print.
          </p>
        </button>
      </div>

      {/* Output Metadata Specs */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-col gap-1.5 text-xs text-slate-600">
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Output Dimensions</span>
          <span className="font-mono font-semibold text-slate-800">
            {state.currentDimensions.width} × {state.currentDimensions.height} px
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Resolution Density</span>
          <span className="font-mono text-slate-800">
            {megapixel} Megapixels ({state.enhanceScale}× Scale)
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Target Filename</span>
          <span className="font-mono text-indigo-600 truncate max-w-[170px]">
            palia-image-studio-edited.{selectedFormat}
          </span>
        </div>
      </div>

      {/* Prominent Download Button */}
      <button
        id="download-final-btn"
        type="button"
        disabled={isProcessing || isExporting}
        onClick={handleDownloadClick}
        className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all ${
          downloadSuccess
            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
            : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
        } ${isProcessing || isExporting ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Rendering Studio Output...</span>
          </>
        ) : downloadSuccess ? (
          <>
            <Check className="w-4 h-4" />
            <span>Downloaded palia-image-studio-edited.{selectedFormat}</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Download {selectedFormat.toUpperCase()}</span>
          </>
        )}
      </button>

      {/* Note */}
      <p className="text-[11px] text-center text-slate-400">
        Direct browser download • No server upload • Zero data saved
      </p>
    </div>
  );
};
