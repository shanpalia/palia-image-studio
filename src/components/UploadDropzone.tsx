/**
 * Palia Image Studio - Main Upload Screen & Dropzone
 * By Hafsa Traders
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Layers,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { SAMPLE_IMAGES, SampleImageItem } from '../data/sampleImages';

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  onSampleSelected: (sample: SampleImageItem) => void;
  isProcessing?: boolean;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileSelected,
  onSampleSelected,
  isProcessing = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = useCallback((file: File) => {
    setErrorMessage(null);
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    // Maximum 25MB check
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Image size is too large (max 25MB). Please upload a smaller image.');
      return;
    }

    onFileSelected(file);
  }, [onFileSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div id="upload-screen" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        id="file-upload-input"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={isProcessing}
      />

      {/* Main Upload Card */}
      <div 
        id="main-upload-card"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`w-full bg-white rounded-3xl border-2 transition-all duration-300 shadow-xl shadow-slate-200/50 p-8 sm:p-12 text-center cursor-pointer relative overflow-hidden group ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/40 ring-4 ring-indigo-500/20 scale-[1.01]'
            : 'border-dashed border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50'
        }`}
      >
        {/* Decorative ambient background */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Badges */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
            <UploadCloud className="w-10 h-10 stroke-[1.75]" />
          </div>
        </div>

        {/* Headings */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-['Space_Grotesk'] mb-3">
          Remove Background & Enhance Images
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-lg mx-auto mb-8 font-normal">
          Upload an image and transform it in seconds.
        </p>

        {/* Prominent Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
          <button
            id="upload-image-primary-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerFileInput();
            }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Image</span>
          </button>

          <button
            id="choose-image-secondary-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerFileInput();
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-4 h-4 text-slate-600" />
            <span>Choose Image</span>
          </button>
        </div>

        {/* Supported Formats and Drag note */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 mb-6">
          <span>Supported Formats:</span>
          {['JPG', 'JPEG', 'PNG', 'WEBP'].map((fmt) => (
            <span key={fmt} className="px-2 py-0.5 rounded-md bg-slate-100 font-mono font-medium text-slate-700 border border-slate-200/60">
              {fmt}
            </span>
          ))}
          <span className="text-slate-400">• Drag & Drop Supported</span>
        </div>

        {/* Privacy Note */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Your image is processed locally whenever supported.</span>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Feature summary cards */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Neural Background Isolation</h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Extract people, products, and objects with crisp sub-pixel alpha transparency.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">2× & 4× Super-Resolution</h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Unsharp edge synthesis, texture reconstruction, and contrast normalization.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Studio Backdrops & Lossless Export</h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Transparent, solid white, studio black, or custom color export in PNG or JPG.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Test Samples Shelf */}
      <div className="w-full mt-10">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Instant Demo
            </span>
            <span className="text-xs text-slate-500">
              Try Palia Image Studio with curated sample images:
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              id={`sample-btn-${sample.id}`}
              type="button"
              onClick={() => onSampleSelected(sample)}
              className="group text-left bg-white rounded-2xl p-2 border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all overflow-hidden"
            >
              <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 mb-2">
                <img
                  src={sample.thumbnail}
                  alt={sample.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-medium text-white">
                  {sample.category}
                </span>
              </div>
              <div className="px-1 pb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {sample.title}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
