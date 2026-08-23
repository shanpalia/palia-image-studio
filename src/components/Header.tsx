/**
 * Palia Image Studio - Header Component
 * By Hafsa Traders
 */

import React from 'react';
import { Sparkles, HelpCircle, Info, RotateCcw, ShieldCheck, Github } from 'lucide-react';

interface HeaderProps {
  hasImage: boolean;
  onReset: () => void;
  onOpenHowItWorks: () => void;
  onOpenAbout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasImage,
  onReset,
  onOpenHowItWorks,
  onOpenAbout,
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onReset} title="Palia Image Studio Home">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold text-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Space_Grotesk'] text-lg font-bold tracking-tight text-slate-900">
                Palia Image Studio
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Browser AI
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 tracking-wide">
              By <span className="text-indigo-600 font-semibold">Hafsa Traders</span>
            </p>
          </div>
        </div>

        {/* Navigation actions */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {hasImage && (
            <button
              id="header-new-image-btn"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Upload another image"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Image</span>
            </button>
          )}

          <button
            id="nav-home-btn"
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Home
          </button>

          <button
            id="nav-how-it-works-btn"
            onClick={onOpenHowItWorks}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>How it Works</span>
          </button>

          <button
            id="nav-about-btn"
            onClick={onOpenAbout}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>About</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
