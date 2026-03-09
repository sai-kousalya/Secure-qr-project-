
import React, { useState } from 'react';
import { ScanResult, DetectionStatus } from '../types';
import { STATUS_UI_CONFIG } from '../constants';
import { RefreshCw, ExternalLink, AlertCircle, CheckCircle, Copy, Check, ShieldAlert, XCircle, User as UserIcon, Globe, Info, Clock, Shield } from 'lucide-react';

interface ResultViewProps {
  result: ScanResult;
  onReset: () => void;
  userName?: string;
}

const ResultView: React.FC<ResultViewProps> = ({ result, onReset, userName }) => {
  const config = STATUS_UI_CONFIG[result.status];
  const isSafe = result.status === DetectionStatus.SAFE;
  const isPhishing = result.status === DetectionStatus.PHISHING;
  
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [reported, setReported] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceedClick = (e: React.MouseEvent) => {
    if (!isSafe) {
      e.preventDefault();
      setShowConfirm(true);
    }
  };

  const confirmProceed = () => {
    window.open(result.url, '_blank', 'noopener,noreferrer');
    setShowConfirm(false);
  };

  const handleReport = async () => {
    try {
      const type = isSafe ? 'falseNegative' : 'falsePositive';
      await fetch('/api/metrics/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      setReported(true);
    } catch (e) {
      console.error("Failed to report:", e);
    }
  };

  return (
    <div className="relative">
      <div className={`glass-card p-6 md:p-8 rounded-[3.5rem] shadow-2xl border-4 ${config.border} space-y-8 transition-all duration-500 animate-in fade-in zoom-in slide-in-from-bottom-8 ${showConfirm ? 'blur-sm pointer-events-none' : ''}`}>
        
        <div className="flex items-center justify-between opacity-60">
           <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-1.5 rounded-lg">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                AUDIT FOR {userName?.split(' ')[0] || 'GUEST'}
              </p>
           </div>
           {result.analysisTime && (
             <div className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-[9px] font-black flex items-center gap-1">
               <Clock className="w-2.5 h-2.5" />
               AUDIT: {result.analysisTime.toFixed(1)}s
             </div>
           )}
        </div>

        <div className={`flex items-center justify-center gap-2 py-3 px-6 rounded-full text-[10px] font-black tracking-[0.3em] uppercase ${isSafe ? 'bg-green-500/10 text-green-700 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-red-500/10 text-red-700'}`}>
          {isSafe ? <Shield className="w-4 h-4 animate-pulse" /> : <AlertCircle className="w-4 h-4" />}
          {isSafe ? 'SECURE REPUTATION VERIFIED' : config.alertMessage}
        </div>

        <div className="flex flex-col items-center text-center space-y-6">
          <div className={`p-8 rounded-[2.5rem] ${config.bg} shadow-inner transform transition-transform hover:scale-105 duration-300 ring-8 ring-white relative`}>
            {config.icon}
            {isSafe && (
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-xl shadow-lg animate-bounce">
                <Check className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            {result.siteName && (
              <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
                 <Globe className="w-4 h-4" />
                 <span className="text-xs font-black uppercase tracking-[0.2em]">{result.siteName}</span>
              </div>
            )}
            <h2 className={`text-3xl md:text-4xl font-black ${config.color} uppercase tracking-tighter leading-none`}>
              {config.label}
            </h2>
            {isSafe && <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-2">Threat Confidence: Low Risk</p>}
          </div>
        </div>

        <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
          <div className="flex items-start gap-4">
            <div className={`mt-1 p-2 rounded-xl flex-shrink-0 ${config.bg} ${config.color}`}>
               <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Security Intel</h4>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">{result.explanation}</p>
            </div>
          </div>
        </div>

        {result.sources && result.sources.length > 0 && (
          <div className="space-y-3">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Grounding Sources</h4>
             <div className="grid grid-cols-1 gap-2">
               {result.sources.map((source, idx) => (
                 <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-indigo-300 transition-all group">
                   <span className="text-[10px] font-bold text-slate-600 truncate max-w-[220px]">{source.title}</span>
                   <ExternalLink className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600" />
                 </a>
               ))}
             </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group">
          <div className="flex justify-between items-center mb-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audited Endpoint</p>
            <button onClick={handleCopy} className="text-[10px] font-black text-indigo-600 flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'COPIED' : 'COPY'}
            </button>
          </div>
          <div className="text-[11px] font-mono break-all text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {result.url}
          </div>
        </div>

        <div className="pt-2 space-y-4">
          <a href={result.url} target={isSafe ? "_blank" : "_self"} rel="noopener noreferrer" onClick={handleProceedClick} className={`w-full ${isSafe ? 'bg-indigo-600 hover:bg-indigo-700' : (isPhishing ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-800 hover:bg-black')} text-white py-5 px-6 rounded-[1.5rem] font-black text-center block transition-all shadow-xl active:scale-95 text-lg flex items-center justify-center gap-3`}>
            {isSafe ? <Shield className="w-5 h-5" /> : null}
            {isSafe ? 'PROCEED TO SITE' : (isPhishing ? 'BYPASS WARNING' : 'ENTER AT RISK')}
          </a>
          
          <div className="flex gap-3">
            <button onClick={onReset} className="flex-1 bg-white border-2 border-slate-100 text-slate-400 py-5 rounded-[1.5rem] font-black transition-all hover:bg-slate-50 flex items-center justify-center gap-3 active:scale-95 group">
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              NEW AUDIT
            </button>
            <button 
              onClick={handleReport} 
              disabled={reported}
              className={`flex-1 border-2 py-5 rounded-[1.5rem] font-black transition-all flex items-center justify-center gap-3 active:scale-95 ${reported ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-slate-100 text-slate-400 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-500'}`}
            >
              {reported ? <CheckCircle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              {reported ? 'REPORTED' : 'REPORT ERROR'}
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm p-8 rounded-[2.5rem] border-4 border-red-500 shadow-2xl space-y-8 animate-in fade-in zoom-in">
            <div className="text-center space-y-4">
              <div className="bg-red-100 p-4 rounded-3xl text-red-600 mx-auto w-fit"><ShieldAlert className="w-10 h-10" /></div>
              <h3 className="text-xl font-black text-slate-800">Critical Threat Alert</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">This URL is flagged for malicious activity. Proceeding exposes your data to interception.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => setShowConfirm(false)} className="w-full bg-slate-100 py-4 rounded-2xl font-black">BACK TO SAFETY</button>
              <button onClick={confirmProceed} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black">PROCEED ANYWAY</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultView;
