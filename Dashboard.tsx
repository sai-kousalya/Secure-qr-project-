
import React, { useEffect, useState } from 'react';
import { User, LogOut, QrCode, ShieldCheck, Search, History, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import { User as UserType, ScanResult, DetectionStatus } from '../types';

interface DashboardProps {
  user: UserType;
  onLogout: () => void;
  onScanClick: () => void;
  onEvaluationClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onScanClick, onEvaluationClick }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history');
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (e) {
        console.error("Failed to fetch history:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getStatusIcon = (status: DetectionStatus) => {
    switch (status) {
      case DetectionStatus.SAFE: return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case DetectionStatus.PHISHING: return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
  };

  const clearHistory = async () => {
    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
      }
    } catch (e) {
      console.error("Failed to clear history:", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-8 rounded-3xl shadow-xl border-t-4 border-indigo-500">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              Hello, {user.fullName.split(' ')[0]}
            </h2>
            <p className="text-slate-500 text-sm font-medium">Security Level: Standard</p>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 mb-8">
          <p className="text-slate-600 text-sm leading-relaxed">
            This system helps you detect whether a QR Code link is <strong>Safe</strong> or <strong>Phishing</strong> using real-time security scanning.
          </p>
        </div>

        <button 
          onClick={onScanClick}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 px-6 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3 active:scale-95 group"
        >
          <QrCode className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          Scan QR Code
        </button>
      </div>

      <div className="glass-card p-6 rounded-3xl border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">Recent Scans</h3>
          </div>
          {history.length > 0 && (
            <button 
              onClick={clearHistory}
              className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">No recent scans found.</div>
        ) : (
          <div className="space-y-3">
            {history.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3 overflow-hidden">
                  {getStatusIcon(scan.status)}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 truncate">{scan.siteName || scan.url}</p>
                    <p className="text-[10px] text-slate-500 truncate">{new Date(scan.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                  scan.status === DetectionStatus.SAFE ? 'bg-emerald-100 text-emerald-700' :
                  scan.status === DetectionStatus.PHISHING ? 'bg-rose-100 text-rose-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {scan.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-100 text-center">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 text-green-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-700">Security Engine</p>
        </div>
        <button 
          onClick={onEvaluationClick}
          className="glass-card p-4 rounded-2xl border border-slate-100 text-center hover:bg-slate-50 transition-colors group"
        >
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-2 text-indigo-600 group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-700">Evaluation Matrix</p>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
