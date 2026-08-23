/**
 * Palia Image Studio - How It Works Modal
 * By Hafsa Traders
 */

import React from 'react';
import { X, Sparkles, UploadCloud, Zap, Palette, Download, ShieldCheck } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: '01',
      title: 'Upload Image',
      icon: UploadCloud,
      desc: 'Drag and drop or select any JPG, PNG, or WEBP photograph. Your image is loaded directly into browser memory without being uploaded to any remote server.',
    },
    {
      step: '02',
      title: 'In-Browser AI Segmentation',
      icon: Sparkles,
      desc: 'Our WebAssembly neural network scans pixel textures to extract people, products, clothing, and vehicles with sub-pixel alpha boundary precision.',
    },
    {
      step: '03',
      title: '2× & 4× Super-Resolution',
      icon: Zap,
      desc: 'Select 2× or 4× enhancement to perform real multi-stage upscaling with unsharp deconvolution, Laplacian edge synthesis, and local contrast optimization.',
    },
    {
      step: '04',
      title: 'Custom Studio Backdrops',
      icon: Palette,
      desc: 'Keep the background transparent, replace it with studio white or black, or choose a custom hex color palette.',
    },
    {
      step: '05',
      title: 'Direct Lossless Export',
      icon: Download,
      desc: 'Download your final edited masterpiece in lossless PNG (with true alpha transparency) or compressed JPG directly to your device.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">How Palia Image Studio Works</h2>
              <p className="text-xs text-slate-500">By Hafsa Traders • Real Client-Side Image AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="space-y-4 mb-6">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-mono font-bold text-indigo-600 mb-1">{item.step}</span>
                  <div className="p-2 rounded-xl bg-white border border-slate-200 text-indigo-600 shadow-xs">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Privacy Highlight */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="text-xs text-emerald-900">
            <span className="font-bold">100% Private & On-Device:</span> Your images never leave your browser. All background removal and super-resolution computations run on your CPU/GPU via WebAssembly.
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
          >
            Got it, Let's Edit
          </button>
        </div>
      </div>
    </div>
  );
};
