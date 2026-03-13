'use client';

import { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

interface InstallPromptProps {
  dict: {
    title: string;
    iosDesc: string;
    androidDesc: string;
    installBtn: string;
  };
}

export default function InstallPrompt({ dict }: InstallPromptProps) {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if running as a PWA
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod|macintosh/.test(userAgent) && 'ontouchend' in document;
    setIsIOS(isIosDevice);

    // Only show if not previously dismissed
    const hasDismissed = localStorage.getItem('gym_ai_pwa_dismissed');

    if (isIosDevice) {
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('gym_ai_pwa_dismissed', 'true');
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="mt-6 rounded-2xl p-4 relative" style={{ background: 'rgba(57,255,20,0.03)', border: '1px solid rgba(57,255,20,0.1)' }}>
      <button onClick={handleDismiss} className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors">
         <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0 text-xs font-bold shadow-lg" style={{ borderColor: '#39ff14', color: '#39ff14', border: '1px solid #39ff14' }}>
          GYM
        </div>
        <div className="pr-6">
          <h3 className="text-sm font-bold text-white">{dict.title}</h3>
          
          {isIOS ? (
            <>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                {dict.iosDesc}
              </p>
              <div className="flex items-center gap-2 mt-3 text-white/50 justify-center bg-black/40 py-2 px-3 rounded-lg border border-white/5">
                 <Share className="w-3.5 h-3.5" />
                 <span className="text-[10px] uppercase font-bold tracking-wider">Tap Share</span>
                 <span className="text-xs">→</span>
                 <PlusSquare className="w-3.5 h-3.5" />
                 <span className="text-[10px] uppercase font-bold tracking-wider">Add to Home</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-white/60 mt-1 mb-3 leading-relaxed">
                {dict.androidDesc}
              </p>
              <button 
                onClick={handleInstallClick}
                className="text-black text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 transition-transform active:scale-95"
                style={{ background: '#39ff14' }}
              >
                <Download className="w-3.5 h-3.5" />
                {dict.installBtn}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
