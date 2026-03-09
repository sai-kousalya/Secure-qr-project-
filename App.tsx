
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Home from './components/Home';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import ResultView from './components/ResultView';
import EvaluationMatrix from './components/EvaluationMatrix';
import { AppView, User, ScanResult } from './types';
import { Loader2, ShieldCheck, Globe, Database, Fingerprint, SearchCheck, Clock } from 'lucide-react';

const ANALYSIS_STAGES = [
  { text: 'Neural Pattern Initialization', icon: <Fingerprint className="w-5 h-5" /> },
  { text: 'Querying Global Threat Lists', icon: <Database className="w-5 h-5" /> },
  { text: 'Reputation Backend Fetch', icon: <Globe className="w-5 h-5" /> },
  { text: 'Search Grounding Audit', icon: <SearchCheck className="w-5 h-5" /> },
  { text: 'Final Security Verdict', icon: <ShieldCheck className="w-5 h-5" /> }
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  const [user, setUser] = useState<User | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('qrshield_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setView('dashboard');
    }
  }, []);

  // Timer logic for scanning feedback
  useEffect(() => {
    if (isScanning) {
      const start = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsedTime((Date.now() - start) / 1000);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isScanning]);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('qrshield_session', JSON.stringify(u));
    setView('dashboard');
  };

  const handleSignup = () => setView('login');

  const handleLogout = () => {
    localStorage.removeItem('qrshield_session');
    setUser(null);
    setView('home');
  };

  const handleScan = async (url: string) => {
    setIsScanning(true);
    setLoadingStage(0);
    setElapsedTime(0);

    const startTime = Date.now();
    
    try {
      // Call backend API for analysis
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (!response.ok) {
        throw new Error('Analysis request failed');
      }
      
      const result = await response.json();
      const finalTime = (Date.now() - startTime) / 1000;
      
      const finalResult = {
        ...result,
        analysisTime: finalTime
      };

      // Save to backend history
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalResult)
        });
      } catch (e) {
        console.error("Failed to save scan history:", e);
      }
      
      setScanResult(finalResult);
      setView('result');
    } catch (error) {
      console.error("Scan failed:", error);
    } finally {
      setIsScanning(false);
    }
  };

  const renderContent = () => {
    if (isScanning) {
      const currentStage = ANALYSIS_STAGES[loadingStage];
      return (
        <div className="glass-card p-10 md:p-14 rounded-[3.5rem] shadow-2xl flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in zoom-in duration-500 border border-white/40">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[50px] rounded-full animate-pulse"></div>
            <div className="relative z-10 w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center border border-slate-50">
               <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black border border-white/20 shadow-lg flex items-center gap-1.5 z-20">
               <Clock className="w-3 h-3 text-indigo-400" />
               {elapsedTime.toFixed(1)}s
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Security Audit Pipeline</h3>
            <div className="bg-indigo-50 border border-indigo-100 px-6 py-4 rounded-3xl flex items-center gap-4 min-w-[280px]">
              <div className="text-indigo-600 animate-bounce">{currentStage.icon}</div>
              <span className="text-sm font-black text-slate-700 uppercase tracking-widest">{currentStage.text}</span>
            </div>
          </div>

          <div className="w-full max-w-[240px] space-y-3">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" 
                style={{ width: `${((loadingStage + 1) / ANALYSIS_STAGES.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Threat Assessment</p>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'home': return <Home onStart={() => setView('login')} />;
      case 'login': return <Auth mode="login" onLogin={handleLogin} onSwitchToSignup={() => setView('signup')} onSwitchToLogin={() => setView('login')} />;
      case 'signup': return <Auth mode="signup" onSignupSuccess={handleSignup} onSwitchToLogin={() => setView('login')} onSwitchToSignup={() => setView('signup')} />;
      case 'dashboard': return user ? <Dashboard user={user} onLogout={handleLogout} onScanClick={() => setView('scanner')} onEvaluationClick={() => setView('evaluation')} /> : null;
      case 'scanner': return <Scanner onScan={handleScan} onCancel={() => setView('dashboard')} />;
      case 'result': return scanResult ? <ResultView result={scanResult} onReset={() => setView('dashboard')} userName={user?.fullName} /> : null;
      case 'evaluation': return <EvaluationMatrix onBack={() => setView('dashboard')} />;
      default: return null;
    }
  };

  return (
    <Layout isHome={view === 'home'} customWidth={view === 'home' ? 'max-w-4xl' : 'max-w-md'}>
      {renderContent()}
    </Layout>
  );
};

export default App;
