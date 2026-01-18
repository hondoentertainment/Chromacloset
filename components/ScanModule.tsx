
import React, { useState, useRef } from 'react';
import { analyzeClosetImage } from '../services/geminiService';
import { WardrobeItem, Category, PatternType } from '../types';

interface ScanModuleProps {
  onScanComplete: (items: WardrobeItem[]) => void;
}

export const ScanModule: React.FC<ScanModuleProps> = ({ onScanComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.8 quality
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const resizedBase64 = await resizeImage(file);
      setPreviewUrl(resizedBase64);
      await processImage(resizedBase64);
    } catch (error) {
      console.error("Image load error:", error);
      alert("Error loading image. Please try another file.");
      setIsProcessing(false);
    }
  };

  const processImage = async (base64: string) => {
    try {
      const results = await analyzeClosetImage(base64);
      
      if (!Array.isArray(results) || results.length === 0) {
        alert("No clear clothing items detected. Try a clearer photo!");
        setIsProcessing(false);
        return;
      }

      const items: WardrobeItem[] = results.map((res, index) => ({
        id: `item-${Date.now()}-${index}`,
        category: (res.category as Category) || Category.TOP,
        subcategory: res.subcategory || 'unknown',
        brand: res.brand || 'Unknown',
        imageUrl: base64, // Now a compressed/resized version
        dominantColorHex: res.dominantColorHex || '#000000',
        paletteHex: [res.dominantColorHex || '#000000'],
        colorFamily: res.colorFamily || 'Neutral',
        colorName: res.colorName || 'Unknown',
        patternType: (res.patternType as PatternType) || PatternType.SOLID,
        confidence: res.confidence || 0.8,
        createdAt: Date.now(),
      }));
      
      onScanComplete(items);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("AI analysis failed. Please check your internet and try a different photo.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Scan Your Closet</h2>
          <p className="text-slate-500">Take a clear photo of your wardrobe. Gemini will identify each item and its precise color palette.</p>
        </div>

        {isProcessing ? (
          <div className="space-y-4">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 animate-[progress_2s_infinite]"></div>
            </div>
            <p className="text-sm font-medium text-indigo-600 animate-pulse">Processing wardrobe intelligence...</p>
            {previewUrl && (
              <img src={previewUrl} className="w-full h-48 object-cover rounded-xl opacity-70" alt="Preview" />
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload Photo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
            <div className="text-xs text-slate-400 mt-2">
              Auto-resized for fast processing
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-slate-100 pt-6 text-left">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Tips for best results:</h4>
          <ul className="text-xs text-slate-500 space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              Use natural daylight if possible
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              Ensure items are clearly visible and not overlapping
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              Flat layouts or hanging views work best
            </li>
          </ul>
        </div>
      </div>
      <style>{`
        @keyframes progress {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 70%; transform: translateX(50%); }
          100% { width: 100%; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
