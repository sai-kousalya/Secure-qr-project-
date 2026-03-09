
import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Loader2, Image as ImageIcon, AlertCircle, Upload, ScanLine, Search, Link as LinkIcon, Target, ShieldAlert, Cpu } from 'lucide-react';

interface ScannerProps {
  onScan: (url: string) => void;
  onCancel: () => void;
}

type ScanMode = 'camera' | 'gallery' | 'url';

const Scanner: React.FC<ScannerProps> = ({ onScan, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<number | null>(null);
  const isScanningRef = useRef(false);
  
  const [scanMode, setScanMode] = useState<ScanMode>('camera');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  const stopScanning = () => {
    isScanningRef.current = false;
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  };

  const tick = () => {
    if (!isScanningRef.current || scanMode !== 'camera') return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // @ts-ignore
        const jsQR = window.jsQR;
        if (jsQR) {
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
          if (code && code.data) {
            stopScanning();
            onScan(code.data);
            return;
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isActive = true;

    const startCamera = async () => {
      if (scanMode !== 'camera') return;
      try {
        setLoading(true);
        setError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.current && isActive) {
          const video = videoRef.current;
          video.srcObject = stream;
          video.onloadedmetadata = async () => {
            if (!isActive) return;
            try {
              await video.play();
              setLoading(false);
              isScanningRef.current = true;
              requestRef.current = requestAnimationFrame(tick);
            } catch (e) {
              setError("Permission granted, but hardware failed to initialize.");
            }
          };
        }
      } catch (err: any) {
        if (!isActive) return;
        let msg = 'Camera access blocked.';
        if (err.name === 'NotAllowedError') msg = 'Camera permissions were denied.';
        else if (err.name === 'NotFoundError') msg = 'No imaging device found.';
        setError(msg);
        setLoading(false);
      }
    };

    if (scanMode === 'camera') startCamera();
    else stopScanning();

    return () => {
      isActive = false;
      stopScanning();
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [scanMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalleryError(null);
    const reader = new FileReader();
    reader.onload = (event) => setSelectedImage(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGalleryScan = () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setGalleryError(null);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // @ts-ignore
      const jsQR = window.jsQR;
      if (jsQR) {
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
        setTimeout(() => {
          setIsAnalyzing(false);
          if (code) onScan(code.data);
          else setGalleryError('No valid QR signature detected in the provided image.');
        }, 1200);
      }
    };
    img.src = selectedImage;
  };

  return (
    <div className="glass-card w-full max-w-lg mx-auto rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/40">
      <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-100 bg-white/60 backdrop-blur-md z-10">
        <div className="flex flex-col">
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none">Security Scanner</h2>
          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-1">Direct Sensor Input</span>
        </div>
        <button onClick={onCancel} className="p-2.5 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-600 active:scale-90">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="px-6 md:px-8 py-4 bg-slate-50/50 border-b border-slate-100">
        <div className="flex bg-white p-1.5 rounded-2xl gap-1 shadow-sm border border-slate-200/50">
          {(['camera', 'gallery', 'url'] as const).map((mode) => (
            <button 
              key={mode}
              onClick={() => { setScanMode(mode); setSelectedImage(null); setGalleryError(null); setError(null); }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-wider ${scanMode === mode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {mode === 'camera' && <Camera className="w-4 h-4" />}
              {mode === 'gallery' && <ImageIcon className="w-4 h-4" />}
              {mode === 'url' && <LinkIcon className="w-4 h-4" />}
              <span>{mode === 'url' ? 'Direct URL' : mode}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col">
        {scanMode === 'camera' && (
          <div className="flex-1 flex flex-col gap-6 items-center">
            <div className="relative w-full flex-1 min-h-[300px] max-h-[500px] aspect-[4/5] bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
              {loading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20 bg-slate-900">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full"></div>
                    <div className="absolute inset-0 w-16 h-16 border-t-4 border-indigo-400 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-70">Initializing Sensor...</p>
                </div>
              )}
              {error ? (
                <div className="p-10 text-center text-white bg-slate-900 absolute inset-0 flex flex-col items-center justify-center z-20 space-y-4">
                  <div className="p-4 bg-red-500/20 rounded-[2rem] border border-red-500/30">
                    <ShieldAlert className="w-10 h-10 text-red-400" />
                  </div>
                  <p className="font-black text-lg uppercase tracking-tight">Access Restricted</p>
                  <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-[200px] mx-auto">{error}</p>
                  <button onClick={() => window.location.reload()} className="px-6 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all">Retry Access</button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-[30px] border-black/40 pointer-events-none z-10"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/20 border-dashed rounded-[3rem] pointer-events-none z-10">
                    <div className="w-full h-full border-2 border-indigo-500/40 rounded-[3rem] animate-pulse"></div>
                  </div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400/80 shadow-[0_0_20px_rgba(129,140,248,1)] animate-scan z-10"></div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Hardware Ready</span>
                  </div>
                </>
              )}
            </div>
            <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
              <Target className="w-5 h-5 text-indigo-600" />
              <p className="text-[10px] text-slate-500 font-bold leading-tight">Align QR code within the frame for automatic security ingestion.</p>
            </div>
          </div>
        )}

        {scanMode === 'gallery' && (
          <div className="flex-1 flex flex-col gap-6 items-center">
            <div className="relative w-full flex-1 min-h-[300px] max-h-[500px] aspect-[4/5] bg-slate-50 rounded-[2.5rem] overflow-hidden border-4 border-white flex items-center justify-center shadow-inner group">
              {selectedImage ? (
                <div className="relative w-full h-full bg-white flex items-center justify-center">
                  <img src={selectedImage} alt="Upload" className="w-full h-full object-contain p-8" />
                  <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white p-2 rounded-xl hover:bg-black transition-all z-20"><X className="w-5 h-5" /></button>
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-30 space-y-4">
                      <Cpu className="w-10 h-10 animate-bounce text-indigo-600" />
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Neural Deconstruction...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="p-8 text-center cursor-pointer flex flex-col items-center gap-6 w-full h-full justify-center hover:bg-slate-100/50 transition-all">
                  <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-xl border border-slate-100 group-hover:scale-110 transition-transform"><Upload className="w-8 h-8" /></div>
                  <div className="space-y-1">
                    <p className="font-black text-slate-800 uppercase text-xs tracking-widest">Ingest Static Image</p>
                    <p className="text-[10px] text-slate-400 font-bold">Select a PNG/JPG for analysis</p>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>
            {selectedImage && <button onClick={handleGalleryScan} disabled={isAnalyzing} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm"><ScanLine className="w-5 h-5" /> Run Security Audit</button>}
            {galleryError && <div className="w-full bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black border border-red-100 flex items-center gap-3"><AlertCircle className="w-5 h-5 flex-shrink-0" /> {galleryError}</div>}
          </div>
        )}

        {scanMode === 'url' && (
          <form onSubmit={(e) => { e.preventDefault(); if (manualUrl.trim()) onScan(manualUrl.trim()); }} className="space-y-8 py-4">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">Endpoint Signature</label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500"><LinkIcon className="w-5 h-5" /></div>
                <input type="text" autoFocus placeholder="https://example.com" value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} className="w-full pl-16 pr-6 py-6 rounded-3xl border-2 border-slate-100 focus:border-indigo-500 focus:outline-none transition-all text-slate-800 bg-slate-50/50 font-black text-lg shadow-inner" />
              </div>
            </div>
            <button type="submit" disabled={!manualUrl.trim()} className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-3xl font-black shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30 uppercase tracking-[0.2em]"><Search className="w-5 h-5" /> Analyze Signature</button>
          </form>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <style>{`
        @keyframes scan { 0% { top: 5%; } 100% { top: 95%; } }
        .animate-scan { animation: scan 3s ease-in-out infinite alternate; }
      `}</style>
    </div>
  );
};

export default Scanner;
