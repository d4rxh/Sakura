import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Share, Plus } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed recently
    const lastDismiss = localStorage.getItem('ks-install-dismiss');
    if (lastDismiss && Date.now() - Number(lastDismiss) < 7 * 24 * 60 * 60 * 1000) return;

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((navigator as any).standalone) return;

    const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    if (iOS) {
      // Show iOS instructions after 4s
      const t = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(t);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShow(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('ks-install-dismiss', String(Date.now()));
  };

  return (
    <AnimatePresence>
      {show && !dismissed && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="fixed bottom-[140px] left-4 right-4 z-[300] max-w-sm mx-auto"
        >
          <div className="rounded-2xl p-4 border border-[#FF6B9D]/30 shadow-2xl shadow-[#FF6B9D]/20"
            style={{ background: 'linear-gradient(135deg, #1E0030, #130018)' }}>
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10"
            >
              <X size={16} className="text-white/50" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden border border-[#FF6B9D]/30"
                style={{ background: 'linear-gradient(135deg,#FF6B9D,#C2185B)' }}>
                <svg viewBox="0 0 512 512" className="w-full h-full p-2">
                  <g transform="translate(256,256)">
                    {[0,72,144,216,288].map(r => (
                      <ellipse key={r} rx="42" ry="75" fill="white" opacity="0.92"
                        transform={`rotate(${r}) translate(0,-78)`}/>
                    ))}
                    <circle r="30" fill="#FFB7C5"/>
                    <polygon points="-12,-18 -12,18 22,0" fill="#8B0045" opacity="0.9"/>
                  </g>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Add Kawai Sakura</p>
                <p className="text-[#D4A0BA] text-xs">Home screen pe save karo — app jaisi feel 🌸</p>
              </div>
            </div>

            {isIOS ? (
              <div className="bg-white/5 rounded-xl p-3 text-xs text-white/70 space-y-1.5">
                <p className="font-bold text-white text-sm mb-2">iOS pe install karo:</p>
                <div className="flex items-center gap-2">
                  <Share size={14} className="text-[#FF6B9D] shrink-0" />
                  <span>Niche <b className="text-white">Share</b> button tap karo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plus size={14} className="text-[#FF6B9D] shrink-0" />
                  <span><b className="text-white">"Add to Home Screen"</b> select karo</span>
                </div>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleInstall}
                className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#FF6B9D,#C2185B)' }}
              >
                <Download size={16} />
                Home Screen pe Add Karo
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
