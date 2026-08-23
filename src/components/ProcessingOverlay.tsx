/**
 * Palia Image Studio - Processing Overlay & Status Modal
 * By Hafsa Traders
 */

import React from 'react';
import { Sparkles, AlertCircle, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { ProcessingState } from '../types';

interface ProcessingOverlayProps {
  status: ProcessingState;
  onDismissError?: () => void;
  onRetry?: () => void;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  status,
  onDismissError,
  onRetry,
}) => {
  if (!status.isProcessing && !status.error) {
    return null;
  }

  const isError = Boolean(status.error);

  return (
    <div id="processing-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-600/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h2 className="text-xs font-bold text-slate-900 leading-none">
              Palia Image Studio
            </h2>
            <span className="text-[10px] text-slate-500 font-medium">
              By Hafsa Traders
            </span>
          </div>
        </div>

        {/* State 1: Active Processing */}
        {!isError && (
          <div className="w-full flex flex-col items-center">
            {/* Spinning Indicator with Glowing Orbit */}
            <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
              <Sparkles className="w-7 h-7 text-indigo-600 animate-bounce" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Processing image...
            </h3>
            
            <p className="text-sm font-semibold text-indigo-600 mb-2">
              {status.stageLabel || 'Segmenting Subject...'}
            </p>

            <p className="text-xs text-slate-500 max-w-xs mb-6 leading-relaxed">
              {status.detail || 'Please wait while in-browser AI computes transparent alpha matting.'}
            </p>

            {/* Real Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden p-0.5 border border-slate-200/80">
              <div
                className="bg-gradient-to-r from-indigo-500 to-sky-500 h-full rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${Math.max(8, status.progress)}%` }}
              />
            </div>

            <div className="w-full flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Progress</span>
              <span>{Math.round(status.progress)}%</span>
            </div>

            {/* Privacy note */}
            <div className="mt-6 flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Running securely on your device</span>
            </div>
          </div>
        )}

        {/* State 2: Error State */}
        {isError && (
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Processing Interrupted
            </h3>

            <p className="text-xs text-slate-600 max-w-xs mb-6 leading-relaxed bg-rose-50/50 p-3 rounded-xl border border-rose-100">
              {status.error || 'Unable to process this image. Please try another image.'}
            </p>

            <div className="flex gap-3 w-full">
              {onDismissError && (
                <button
                  type="button"
                  onClick={onDismissError}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Dismiss
                </button>
              )}
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
