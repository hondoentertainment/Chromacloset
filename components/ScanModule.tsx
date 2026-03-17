
import React, { useState, useRef, useEffect } from 'react';
import { analyzeClosetImage, processQRCode } from '../services/geminiService';
import { WardrobeItem, Category, PatternType, BoundingBox } from '../types';
import { trackEvent } from '../services/analyticsService';

export type ScanMode = 'cloth' | 'qr';

export interface ScanTelemetry {
  source: 'upload' | 'live';
  mode: ScanMode;
  latencyMs: number;
}

interface ScanModuleProps {
  onScanComplete: (items: WardrobeItem[], telemetry?: ScanTelemetry) => void;
}

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
  const [lastScanTelemetry, setLastScanTelemetry] = useState<ScanTelemetry | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanErrorSource, setScanErrorSource] = useState<'upload' | 'live' | null>(null);
  const [baselineItems, setBaselineItems] = useState<Record<string, Partial<WardrobeItem>>>({});
  const [showAdvancedEdits, setShowAdvancedEdits] = useState(true);

  const mapScanResultToItem = (res: any, index: number, imageUrl: string): WardrobeItem => ({
    id: `item-${Date.now()}-${index}`,
    category: (res.category as Category) || Category.TOP,
    subcategory: res.subcategory || 'unknown',
    brand: res.brand || 'Unknown',
    imageUrl,
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
  });

  const mapScanResultToItem = (res: any, index: number, imageUrl: string): WardrobeItem => ({
    id: `item-${Date.now()}-${index}`,
    category: (res.category as Category) || Category.TOP,
    subcategory: res.subcategory || 'unknown',
    brand: res.brand || 'Unknown',
    imageUrl,
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
  });

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
    const startTs = Date.now();
    trackEvent('scan_started', { source: 'upload', mode });
    setIsProcessing(true);
    try {
      const base64 = await resizeImage(file);
      setPreviewUrl(base64);
      
      if (mode === 'cloth') {
        const results = await analyzeClosetImage(base64);
        const items: WardrobeItem[] = results.map((res: any, index: number) => mapScanResultToItem(res, index, base64));
        setDetectedItems(items);
        setBaselineItems(Object.fromEntries(items.map(item => [item.id, {
          category: item.category,
          patternType: item.patternType,
          subcategory: item.subcategory,
          colorName: item.colorName,
          colorFamily: item.colorFamily
        }])));
        setLastScanTelemetry({ source: 'upload', mode, latencyMs: Date.now() - startTs });
        setScanError(null);
        setLastScanTelemetry({ source: 'upload', mode, latencyMs: Date.now() - startTs });
        trackEvent('scan_completed', {
          source: 'upload',
          mode,
          items_detected: items.length,
          latency_ms: Date.now() - startTs,
        });
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
          setBaselineItems({ [item.id]: {
            category: item.category,
            patternType: item.patternType,
            subcategory: item.subcategory,
            colorName: item.colorName,
            colorFamily: item.colorFamily
          } });
          setLastScanTelemetry({ source: 'upload', mode, latencyMs: Date.now() - startTs });
          setScanError(null);
          setLastScanTelemetry({ source: 'upload', mode, latencyMs: Date.now() - startTs });
          trackEvent('scan_completed', {
            source: 'upload',
            mode,
            items_detected: 1,
            latency_ms: Date.now() - startTs,
          });
        }
      }
    } catch (error) {
      trackEvent('scan_failed', { source: 'upload', mode, reason: 'processing_error' });
      setScanError('Upload scan failed. Try a clearer image or retry.');
      setScanErrorSource('upload');
      alert("Processing failed. Try a clearer photo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLiveScan = async () => {
    const base64 = captureFrame();
    if (!base64) {
      trackEvent('scan_failed', { source: 'live', mode, reason: 'capture_error' });
      setScanError('Camera capture failed. Please retry.');
      setScanErrorSource('live');
      return;
    }
      return;
    }
    if (!base64) return;
    const startTs = Date.now();
    trackEvent('scan_started', { source: 'live', mode });
    
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
          setBaselineItems({ [item.id]: {
            category: item.category,
            patternType: item.patternType,
            subcategory: item.subcategory,
            colorName: item.colorName,
            colorFamily: item.colorFamily
          } });
          setLastScanTelemetry({ source: 'live', mode, latencyMs: Date.now() - startTs });
          setScanError(null);
          setLastScanTelemetry({ source: 'live', mode, latencyMs: Date.now() - startTs });
          trackEvent('scan_completed', {
            source: 'live',
            mode,
            items_detected: 1,
            latency_ms: Date.now() - startTs,
          });
        }
      } else {
        const results = await analyzeClosetImage(base64);
        const items: WardrobeItem[] = results.map((res: any, index: number) => mapScanResultToItem(res, index, base64));
        setDetectedItems(items);
        setBaselineItems(Object.fromEntries(items.map(item => [item.id, {
          category: item.category,
          patternType: item.patternType,
          subcategory: item.subcategory,
          colorName: item.colorName,
          colorFamily: item.colorFamily
        }])));
        setLastScanTelemetry({ source: 'live', mode, latencyMs: Date.now() - startTs });
        setScanError(null);
      }
    } catch (error) {
      trackEvent('scan_failed', { source: 'live', mode, reason: 'processing_error' });
      setScanError('Live scan failed. Ensure subject is well lit and retry.');
      setScanErrorSource('live');
      }
    } catch (error) {
      trackEvent('scan_failed', { source: 'live', mode, reason: 'processing_error' });
      setScanError('Live scan failed. Ensure subject is well lit and retry.');
      setScanErrorSource('live');
        setLastScanTelemetry({ source: 'live', mode, latencyMs: Date.now() - startTs });
        trackEvent('scan_completed', {
          source: 'live',
          mode,
          items_detected: items.length,
          latency_ms: Date.now() - startTs,
        });
      }
    } catch (error) {
      trackEvent('scan_failed', { source: 'live', mode, reason: 'processing_error' });
      alert("Scan failed. Ensure the item/code is well lit and centered.");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmSave = () => {
    if (detectedItems) {
      const hasInvalid = detectedItems.some(item => !item.subcategory.trim() || !item.colorName.trim());
      if (hasInvalid) {
        setScanError('Please provide both subcategory and color name for all items before saving.');
        setScanErrorSource(lastScanTelemetry?.source ?? 'upload');
        return;
      }

      onScanComplete(detectedItems, lastScanTelemetry || undefined);
      setDetectedItems(null);
      setPreviewUrl(null);
      setLastScanTelemetry(null);
      setBaselineItems({});
      setScanError(null);
      setScanErrorSource(null);
      setBaselineItems({});
      setScanError(null);
      setScanErrorSource(null);
    }
  };

  const discardScan = () => {
    if (confirm("Discard this scan?")) {
      setDetectedItems(null);
      setPreviewUrl(null);
      setLastScanTelemetry(null);
      setBaselineItems({});
      setScanError(null);
      setScanErrorSource(null);
    }
  };

  const deleteSingleItem = (id: string) => {
    setDetectedItems(prev => prev ? prev.filter(i => i.id !== id) : null);
  };


  const updateDetectedItem = <K extends keyof WardrobeItem>(id: string, field: K, value: WardrobeItem[K]) => {
    if (!['category', 'patternType', 'subcategory', 'colorName', 'colorFamily'].includes(String(field))) {
      return;
    }

    setDetectedItems(prev => prev ? prev.map(item => {
      if (item.id !== id) return item;
      const next = { ...item, [field]: value } as WardrobeItem;
      const baseline = baselineItems[id];
      const isEdited = baseline ? (
        next.category !== baseline.category ||
        next.patternType !== baseline.patternType ||
        next.subcategory !== baseline.subcategory ||
        next.colorName !== baseline.colorName ||
        next.colorFamily !== baseline.colorFamily
      ) : true;

      trackEvent('scan_item_edited', {
        item_id: id,
        fields: [field as 'category' | 'patternType' | 'subcategory' | 'colorName' | 'colorFamily']
      });

      return { ...next, isEdited };
    }) : prev);
  };


  const applyFieldToSimilar = <K extends keyof WardrobeItem>(id: string, field: K, value: WardrobeItem[K]) => {
    if (!detectedItems || !['category', 'patternType', 'colorFamily'].includes(String(field))) return;
    const source = detectedItems.find(i => i.id === id);
    if (!source) return;

    const similarIds = detectedItems
      .filter(i => i.id !== id && i.subcategory.toLowerCase() === source.subcategory.toLowerCase())
      .map(i => i.id);

    if (!similarIds.length) return;

    setDetectedItems(prev => prev ? prev.map(item => {
      if (!similarIds.includes(item.id)) return item;
      const next = { ...item, [field]: value } as WardrobeItem;
      const baseline = baselineItems[item.id];
      const isEdited = baseline ? (
        next.category !== baseline.category ||
        next.patternType !== baseline.patternType ||
        next.subcategory !== baseline.subcategory ||
        next.colorName !== baseline.colorName ||
        next.colorFamily !== baseline.colorFamily
      ) : true;
      return { ...next, isEdited };
    }) : prev);

    trackEvent('scan_item_edited', {
      item_id: id,
      fields: [field as 'category' | 'patternType' | 'colorFamily']
    });
  };

  const CATEGORY_OPTIONS = Object.values(Category);
  const PATTERN_OPTIONS = Object.values(PatternType);
  const COLOR_FAMILY_OPTIONS = ['Neutral', 'Black', 'White', 'Gray', 'Blue', 'Green', 'Red', 'Pink', 'Purple', 'Yellow', 'Orange', 'Brown'];

  const resetItemToBaseline = (id: string) => {
    const baseline = baselineItems[id];
    if (!baseline) return;

    setDetectedItems(prev => prev ? prev.map(item => item.id === id
      ? {
          ...item,
          category: (baseline.category as Category) || item.category,
          patternType: (baseline.patternType as PatternType) || item.patternType,
          subcategory: (baseline.subcategory as string) || item.subcategory,
          colorName: (baseline.colorName as string) || item.colorName,
          colorFamily: (baseline.colorFamily as string) || item.colorFamily,
          isEdited: false
        }
      : item) : prev);
  };

  const triggerRetry = () => {
    setScanError(null);
    if (scanErrorSource === 'live' && mode === 'qr') {
      startCamera();
      return;
    }
    fileInputRef.current?.click();
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

            <button
              onClick={() => setShowAdvancedEdits(v => !v)}
              className="flex-1 md:flex-none px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              {showAdvancedEdits ? 'Hide Edit Controls' : 'Show Edit Controls'}
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
                className={`bg-white rounded-2xl p-4 border transition-all group ${hoveredItemId === item.id ? 'border-indigo-600 shadow-indigo-50 shadow-lg ring-1 ring-indigo-600' : 'border-slate-100 shadow-sm'}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-50 relative">
                    <div className="w-full h-full" style={{ backgroundColor: item.dominantColorHex }} />
                    {item.confidence > 0.9 && (
                      <div className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5">
                        <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">{item.category}</p>
                    <h4 className="font-bold text-slate-900 truncate capitalize">{item.colorName} {item.subcategory}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.brand}</span>
                      {item.isEdited && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">Edited</span>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => resetItemToBaseline(item.id)}
                    className="text-[9px] text-indigo-500 font-bold hover:underline"
                    title="Reset edits"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => deleteSingleItem(item.id)}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    title="Remove item"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  </div>
                </div>

                {showAdvancedEdits && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[10px] font-bold text-slate-500 flex flex-col gap-1">
                    Category
                    <select
                      value={item.category}
                      onChange={(e) => updateDetectedItem(item.id, 'category', e.target.value as Category)}
                      className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                    >
                      {CATEGORY_OPTIONS.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => applyFieldToSimilar(item.id, 'category', item.category)}
                      className="mt-1 text-[9px] text-indigo-500 font-bold hover:underline text-left"
                    >
                      Apply to similar
                    </button>
                  </label>

                  <label className="text-[10px] font-bold text-slate-500 flex flex-col gap-1">
                    Pattern
                    <select
                      value={item.patternType}
                      onChange={(e) => updateDetectedItem(item.id, 'patternType', e.target.value as PatternType)}
                      className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                    >
                      {PATTERN_OPTIONS.map((pattern) => (
                        <option key={pattern} value={pattern}>{pattern}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => applyFieldToSimilar(item.id, 'patternType', item.patternType)}
                      className="mt-1 text-[9px] text-indigo-500 font-bold hover:underline text-left"
                    >
                      Apply to similar
                    </button>
                  </label>

                  <label className="text-[10px] font-bold text-slate-500 flex flex-col gap-1 col-span-2">
                    Subcategory
                    <input
                      value={item.subcategory}
                      onChange={(e) => updateDetectedItem(item.id, 'subcategory', e.target.value)}
                      className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                    />
                  </label>

                  <label className="text-[10px] font-bold text-slate-500 flex flex-col gap-1">
                    Color Name
                    <input
                      value={item.colorName}
                      onChange={(e) => updateDetectedItem(item.id, 'colorName', e.target.value)}
                      className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                    />
                  </label>

                  <label className="text-[10px] font-bold text-slate-500 flex flex-col gap-1">
                    Color Family
                    <select
                      value={item.colorFamily}
                      onChange={(e) => updateDetectedItem(item.id, 'colorFamily', e.target.value)}
                      className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                    >
                      {COLOR_FAMILY_OPTIONS.map((family) => (
                        <option key={family} value={family}>{family}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => applyFieldToSimilar(item.id, 'colorFamily', item.colorFamily)}
                      className="mt-1 text-[9px] text-indigo-500 font-bold hover:underline text-left"
                    >
                      Apply to similar
                    </button>
                  </label>
                </div>
                )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[10px] font-bold text-slate-500 flex flex-col gap-1">
                    Category
                    <select
                      value={item.category}
                      onChange={(e) => updateDetectedItem(item.id, 'category', e.target.value as Category)}
                      className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                    >
                      {CATEGORY_OPTIONS.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </label>

                  <label className="text-[10px] font-bold text-slate-500 flex flex-col gap-1">
                    Pattern
                    <select
                      value={item.patternType}
                      onChange={(e) => updateDetectedItem(item.id, 'patternType', e.target.value as PatternType)}
                      className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                    >
                      {PATTERN_OPTIONS.map((pattern) => (
                        <option key={pattern} value={pattern}>{pattern}</option>
                      ))}
                    </select>
                  </label>

                  <label className="text-[10px] font-bold text-slate-500 flex flex-col gap-1 col-span-2">
                    Subcategory
                    <input
                      value={item.subcategory}
                      onChange={(e) => updateDetectedItem(item.id, 'subcategory', e.target.value)}
                      className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                    />
                  </label>

                  <label className="text-[10px] font-bold text-slate-500 flex flex-col gap-1">
                    Color Name
                    <input
                      value={item.colorName}
                      onChange={(e) => updateDetectedItem(item.id, 'colorName', e.target.value)}
                      className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                    />
                  </label>

                  <label className="text-[10px] font-bold text-slate-500 flex flex-col gap-1">
                    Color Family
                    <select
                      value={item.colorFamily}
                      onChange={(e) => updateDetectedItem(item.id, 'colorFamily', e.target.value)}
                      className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                    >
                      {COLOR_FAMILY_OPTIONS.map((family) => (
                        <option key={family} value={family}>{family}</option>
                      ))}
                    </select>
                  </label>
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


        {scanError && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-left">
            <p className="text-sm text-rose-700 font-semibold">{scanError}</p>
            <button onClick={triggerRetry} className="mt-2 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700">
              Retry
            </button>
          </div>
        )}

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
