
import React, { useState, useRef, useEffect } from 'react';
import { analyzeClosetImage, processQRCode } from '../services/geminiService';
import { WardrobeItem, Category, PatternType, BoundingBox } from '../types';

interface ScanModuleProps {
  onScanComplete: (items: WardrobeItem[]) => void;
}

type ScanMode = 'cloth' | 'qr';

export const ScanModule: React.FC<ScanModuleProps> = ({ onScanComplete }) => {
  const [mode, setMode] = useState<ScanMode>('cloth');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<WardrobeItem[] | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reviewContainerRef = useRef<HTMLDivElement>(null);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1200; // Increased for better spatial detail
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
      };
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Please allow camera access to use the scanner.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureFrame = (): string | null => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    }
    return null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const base64 = await resizeImage(file);
      setPreviewUrl(base64);
      
      if (mode === 'cloth') {
        const results = await analyzeClosetImage(base64);
        const items: WardrobeItem[] = results.map((res: any, index: number) => ({
          id: `item-${Date.now()}-${index}`,
          category: (res.category as Category) || Category.TOP,
          subcategory: res.subcategory || 'unknown',
          brand: res.brand || 'Unknown',
          imageUrl: base64,
          dominantColorHex: res.dominantColorHex || '#000000',
          paletteHex: [res.dominantColorHex || '#000000'],
          colorFamily: res.colorFamily || 'Neutral',
          colorName: res.colorName || 'Unknown',
          patternType: (res.patternType as PatternType) || PatternType.SOLID,
          confidence: res.confidence || 0.8,
          createdAt: Date.now(),
          box: res.box_2d ? {
            ymin: res.box_2d[0],
            xmin: res.box_2d[1],
            ymax: res.box_2d[2],
            xmax: res.box_2d[3]
          } : undefined
        }));
        setDetectedItems(items);
      } else {
        const res = await processQRCode(base64);
        if (res) {
          const item: WardrobeItem = {
            id: `qr-${Date.now()}`,
            category: (res.category as Category) || Category.TOP,
            subcategory: res.subcategory || 'qr-item',
            brand: res.brand || 'Digital Tag',
            imageUrl: base64,
            dominantColorHex: res.dominantColorHex || '#000000',
            paletteHex: [res.dominantColorHex || '#000000'],
            colorFamily: res.colorFamily || 'Neutral',
            colorName: res.colorName || 'Unknown',
            patternType: (res.patternType as PatternType) || PatternType.SOLID,
            confidence: 1.0,
            createdAt: Date.now(),
          };
          setDetectedItems([item]);
        }
      }
    } catch (error) {
      alert("Processing failed. Try a clearer photo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLiveScan = async () => {
    const base64 = captureFrame();
    if (!base64) return;
    
    setIsProcessing(true);
    setPreviewUrl(base64);
    stopCamera();

    try {
      if (mode === 'qr') {
        const res = await processQRCode(base64);
        if (res) {
          const item: WardrobeItem = {
            id: `qr-${Date.now()}`,
            category: (res.category as Category) || Category.TOP,
            subcategory: res.subcategory || 'qr-item',
            brand: res.brand || 'Digital Tag',
            imageUrl: base64,
            dominantColorHex: res.dominantColorHex || '#000000',
            paletteHex: [res.dominantColorHex || '#000000'],
            colorFamily: res.colorFamily || 'Neutral',
            colorName: res.colorName || 'Unknown',
            patternType: (res.patternType as PatternType) || PatternType.SOLID,
            confidence: 1.0,
            createdAt: Date.now(),
          };
          setDetectedItems([item]);
        }
      } else {
        const results = await analyzeClosetImage(base64);
        const items: WardrobeItem[] = results.map((res: any, index: number) => ({
          id: `item-${Date.now()}-${index}`,
          category: (res.category as Category) || Category.TOP,
          subcategory: res.subcategory || 'unknown',
          brand: res.brand || 'Unknown',
          imageUrl: base64,
          dominantColorHex: res.dominantColorHex || '#000000',
          paletteHex: [res.dominantColorHex || '#000000'],
          colorFamily: res.colorFamily || 'Neutral',
          colorName: res.colorName || 'Unknown',
          patternType: (res.patternType as PatternType) || PatternType.SOLID,
          confidence: res.confidence || 0.8,
          createdAt: Date.now(),
          box: res.box_2d ? {
            ymin: res.box_2d[0],
            xmin: res.box_2d[1],
            ymax: res.box_2d[2],
            xmax: res.box_2d[3]
          } : undefined
        }));
        setDetectedItems(items);
      }
    } catch (error) {
      alert("Scan failed. Ensure the item/code is well lit and centered.");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmSave = () => {
    if (detectedItems) {
      onScanComplete(detectedItems);
      setDetectedItems(null);
      setPreviewUrl(null);
    }
  };

  const discardScan = () => {
    if (confirm("Discard this scan?")) {
      setDetectedItems(null);
      setPreviewUrl(null);
    }
  };

  const deleteSingleItem = (id: string) => {
    setDetectedItems(prev => prev ? prev.filter(i => i.id !== id) : null);
  };

  if (detectedItems) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Review Intel</h2>
            <p className="text-slate-500">
              {mode === 'qr' ? 'Verified item from digital tag.' : `Gemini detected ${detectedItems.length} items in space.`} 
              Hover on boxes to identify.
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={discardScan} className="flex-1 md:flex-none px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">
              Discard All
            </button>
            <button onClick={confirmSave} className="flex-1 md:flex-none px-10 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700">
              Add {detectedItems.length} to Closet
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Spatial Review Panel */}
          <div className="lg:col-span-7 bg-black rounded-[3rem] overflow-hidden shadow-2xl relative aspect-[4/3] group">
            {previewUrl && <img src={previewUrl} className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100" alt="Spatial Analysis" />}
            
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none">
              {detectedItems.map(item => {
                if (!item.box) return null;
                const isHovered = hoveredItemId === item.id;
                return (
                  <g key={item.id} className="pointer-events-auto cursor-pointer" 
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                  >
                    <rect 
                      x={item.box.xmin} 
                      y={item.box.ymin} 
                      width={item.box.xmax - item.box.xmin} 
                      height={item.box.ymax - item.box.ymin}
                      fill={isHovered ? 'rgba(79, 70, 229, 0.2)' : 'transparent'}
                      stroke={isHovered ? '#4f46e5' : 'rgba(255, 255, 255, 0.5)'}
                      strokeWidth={isHovered ? "4" : "2"}
                      rx="10"
                      className="transition-all duration-300"
                    />
                    {isHovered && (
                      <foreignObject 
                        x={item.box.xmin} 
                        y={Math.max(0, item.box.ymin - 60)} 
                        width="300" 
                        height="60"
                      >
                        <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-xl inline-flex flex-col animate-in slide-in-from-bottom-2">
                          <span className="text-[10px] font-black uppercase tracking-widest leading-none">{item.category}</span>
                          <span className="text-sm font-bold truncate leading-tight">{item.colorName} {item.subcategory}</span>
                        </div>
                      </foreignObject>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Item List Panel */}
          <div className="lg:col-span-5 space-y-4 max-h-[70vh] overflow-y-auto pr-2" ref={reviewContainerRef}>
            {detectedItems.map((item) => (
              <div 
                key={item.id} 
                onMouseEnter={() => setHoveredItemId(item.id)}
                onMouseLeave={() => setHoveredItemId(null)}
                className={`bg-white rounded-2xl p-4 border transition-all flex items-center gap-4 group ${hoveredItemId === item.id ? 'border-indigo-600 shadow-indigo-50 shadow-lg ring-1 ring-indigo-600' : 'border-slate-100 shadow-sm'}`}
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-50 relative">
                  <div className="w-full h-full" style={{ backgroundColor: item.dominantColorHex }} />
                  {item.confidence > 0.9 && (
                    <div className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5">
                      <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">{item.category}</p>
                      <h4 className="font-bold text-slate-900 truncate capitalize">{item.colorName} {item.subcategory}</h4>
                    </div>
                    <button 
                      onClick={() => deleteSingleItem(item.id)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.brand} • {item.patternType}</span>
                  </div>
                </div>
              </div>
            ))}
            {detectedItems.length === 0 && (
              <div className="text-center py-12 text-slate-400 italic">No items identified. Try again?</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mx-auto shadow-sm">
        <button 
          onClick={() => { setMode('cloth'); stopCamera(); }}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'cloth' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Cloth Analysis
        </button>
        <button 
          onClick={() => { setMode('qr'); startCamera(); }}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'qr' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          QR Code Scanner
        </button>
      </div>

      <div className="bg-white rounded-[3rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden">
        <div className="mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${mode === 'qr' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
            {mode === 'cloth' ? (
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            ) : (
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {mode === 'cloth' ? 'Spatial Analysis' : 'Scan Product Tag'}
          </h2>
          <p className="text-slate-500 px-4">
            {mode === 'cloth' 
              ? 'Upload a photo of your closet. Gemini will detect and label every item it sees.' 
              : 'Scan the QR code on a store tag or receipt to add verified data.'}
          </p>
        </div>

        {isProcessing ? (
          <div className="space-y-6">
            <div className="relative h-64 bg-slate-50 rounded-3xl overflow-hidden border border-slate-100">
              <div className={`absolute inset-x-0 h-1 shadow-[0_0_15px_rgba(79,70,229,0.8)] animate-scan z-20 ${mode === 'qr' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
              {previewUrl && <img src={previewUrl} className="w-full h-full object-cover opacity-60 scale-110 blur-[2px]" alt="Preview" />}
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-xl flex items-center gap-3">
                   <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                   <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Identifying region...</span>
                 </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className={`text-sm font-black animate-pulse uppercase tracking-widest ${mode === 'qr' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                {mode === 'qr' ? 'Decrypting Secure Tag...' : 'Gemini Spatial Intelligence active'}
              </p>
              <p className="text-xs text-slate-400">Mapping items in 3D space</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {mode === 'qr' && (
              <div className="relative h-64 bg-black rounded-3xl overflow-hidden shadow-inner border-2 border-slate-100">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                   <div className="w-48 h-48 border-2 border-white/50 rounded-3xl flex items-center justify-center">
                      <div className="w-full h-0.5 bg-emerald-400/50 shadow-[0_0_8px_#34d399] animate-scan-slow"></div>
                   </div>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full px-8">
                   <button 
                    onClick={handleLiveScan}
                    className="w-full py-3 bg-white text-slate-900 font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                   >
                     Capture & Parse Code
                   </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className={`w-full py-5 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-3 ${
                  mode === 'qr' 
                  ? 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                }`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Upload {mode === 'qr' ? 'Tag' : 'Closet View'}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0.5; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0.5; }
        }
        @keyframes scan-slow {
          0% { top: 10%; }
          100% { top: 90%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        .animate-scan-slow {
          animation: scan-slow 2s ease-in-out infinite alternate;
          position: absolute;
          left: 0;
          right: 0;
        }
      `}</style>
    </div>
  );
};
