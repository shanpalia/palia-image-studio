/**
 * Palia Image Studio - About Modal & GitHub Pages Deployment Guide
 * By Hafsa Traders
 */

import React from 'react';
import { X, Sparkles, Github, Globe, ShieldCheck, Terminal, CheckCircle2, Cpu } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">About Palia Image Studio</h2>
              <p className="text-xs text-slate-500">Engineered by <span className="font-semibold text-indigo-600">Hafsa Traders</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mission Statement */}
        <div className="mb-6 space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong>Palia Image Studio</strong> is a modern, lightweight, privacy-focused image editing application built to operate completely within the browser. Designed by <strong>Hafsa Traders</strong>, it combines client-side neural segmentation with advanced super-resolution algorithms.
          </p>
          <p>
            Unlike typical image editing platforms that upload user photos to external servers and charge subscriptions, Palia Image Studio executes real WebAssembly neural models and Canvas convolutions directly on your device CPU/GPU.
          </p>
        </div>

        {/* Technical Architecture */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>Architecture & Technology</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>ONNX Runtime WebAssembly</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Unsharp Mask Deconvolution</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Laplacian Edge Synthesis</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>GitHub Pages Static Hostable</span>
            </div>
          </div>
        </div>

        {/* GitHub Pages Deployment Steps */}
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-white mb-3">
            <Terminal className="w-4 h-4 text-sky-400" />
            <span>Deploy to GitHub Pages (2 Steps)</span>
          </div>

          <ol className="space-y-2.5 text-xs text-slate-300 list-decimal list-inside leading-relaxed font-mono">
            <li>
              <span className="text-white font-sans font-medium">Build static output:</span>
              <div className="bg-slate-800 p-2 rounded-lg mt-1 text-sky-300">
                npm run build
              </div>
            </li>
            <li>
              <span className="text-white font-sans font-medium">Push `dist` folder to gh-pages branch:</span>
              <div className="bg-slate-800 p-2 rounded-lg mt-1 text-sky-300">
                npx gh-pages -d dist
              </div>
            </li>
          </ol>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400 font-medium">
            Version 1.0.0 • Hafsa Traders Production Release
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
