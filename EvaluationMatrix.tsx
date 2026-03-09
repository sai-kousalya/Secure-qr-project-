
import React, { useEffect, useState } from 'react';
import { Metrics } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { ArrowLeft, Activity, ShieldCheck, AlertTriangle, Target, Zap } from 'lucide-react';

interface EvaluationMatrixProps {
  onBack: () => void;
}

const EvaluationMatrix: React.FC<EvaluationMatrixProps> = ({ onBack }) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/metrics');
        const data = await res.json();
        setMetrics(data);
      } catch (e) {
        console.error("Failed to fetch metrics:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const confusionData = [
    { name: 'True Positive', value: metrics.truePositives, color: '#10b981' },
    { name: 'False Positive', value: metrics.falsePositives, color: '#f43f5e' },
    { name: 'True Negative', value: metrics.trueNegatives, color: '#3b82f6' },
    { name: 'False Negative', value: metrics.falseNegatives, color: '#f59e0b' },
  ];

  const performanceMetrics = [
    { label: 'Accuracy', value: (metrics.accuracy * 100).toFixed(1) + '%', icon: <Target className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Precision', value: (metrics.precision * 100).toFixed(1) + '%', icon: <ShieldCheck className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Recall', value: (metrics.recall * 100).toFixed(1) + '%', icon: <Activity className="w-5 h-5" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'F1 Score', value: (metrics.f1Score * 100).toFixed(1) + '%', icon: <Zap className="w-5 h-5" />, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Evaluation Matrix</h2>
        <div className="w-10"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {performanceMetrics.map((m, i) => (
          <div key={i} className={`p-4 rounded-3xl border border-slate-100 shadow-sm ${m.bg}`}>
            <div className={`${m.color} mb-2`}>{m.icon}</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</p>
            <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6 rounded-[2.5rem] border border-slate-100 shadow-xl">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          Confusion Matrix Visualization
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confusionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {confusionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">True Positives</p>
                <p className="text-2xl font-black text-emerald-700">{metrics.truePositives}</p>
                <p className="text-[9px] text-emerald-600/70 font-medium mt-1">Correctly identified phishing</p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">True Negatives</p>
                <p className="text-2xl font-black text-blue-700">{metrics.trueNegatives}</p>
                <p className="text-[9px] text-blue-600/70 font-medium mt-1">Correctly identified safe sites</p>
              </div>
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">False Positives</p>
                <p className="text-2xl font-black text-rose-700">{metrics.falsePositives}</p>
                <p className="text-[9px] text-rose-600/70 font-medium mt-1">Safe sites flagged as phishing</p>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">False Negatives</p>
                <p className="text-2xl font-black text-amber-700">{metrics.falseNegatives}</p>
                <p className="text-[9px] text-amber-600/70 font-medium mt-1">Phishing sites missed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <h4 className="text-lg font-black uppercase tracking-widest mb-2">Model Performance Summary</h4>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            The detection engine is currently operating at <span className="text-emerald-400 font-bold">{(metrics.accuracy * 100).toFixed(1)}% accuracy</span>. 
            The high precision score indicates a very low rate of false alarms, while the recall reflects our ability to catch sophisticated phishing attempts.
          </p>
          <div className="flex items-center gap-4">
            <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${metrics.f1Score * 100}%` }}></div>
            </div>
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">F1 Score: {(metrics.f1Score * 100).toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationMatrix;
