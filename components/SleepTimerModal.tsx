import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, X, Moon, Check } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';

const OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90];

export const SleepTimerButton: React.FC = () => {
  const { sleepTimerEnd, setSleepTimer, setIsPlaying } = usePlayerStore();
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!sleepTimerEnd) { setRemaining(null); return; }
    const iv = setInterval(() => {
      const rem = Math.max(0, sleepTimerEnd - Date.now());
      setRemaining(rem);
      if (rem === 0) {
        setIsPlaying(false);
        setSleepTimer(null);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [sleepTimerEnd]);

  const fmt = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2,'0')}`;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`relative p-2 rounded-full transition-all ${sleepTimerEnd ? 'text-[#FF6B9D]' : 'text-white/40 hover:text-white'}`}
        title="Sleep Timer"
      >
        <Moon size={20} />
        {sleepTimerEnd && remaining !== null && (
          <span className="absolute -top-1 -right-1 text-[9px] bg-[#FF6B9D] text-white rounded-full px-1 font-bold min-w-[28px] text-center">
            {fmt(remaining)}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-end justify-center"
            onClick={() => setOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-md rounded-t-3xl p-6 pb-10"
              style={{ background: 'linear-gradient(180deg,#1E0030,#0A000F)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Moon size={20} className="text-[#FF6B9D]" />
                  <h3 className="text-white font-bold text-lg">Sleep Timer</h3>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-white/10">
                  <X size={20} className="text-white/70" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-4">
                {OPTIONS.map(min => {
                  const isActive = sleepTimerEnd && Math.abs((sleepTimerEnd - Date.now()) - min * 60000) < 5000;
                  return (
                    <motion.button
                      key={min}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setSleepTimer(min); setOpen(false); }}
                      className={`py-3 rounded-2xl flex flex-col items-center gap-1 border transition-all ${
                        isActive
                          ? 'border-[#FF6B9D] bg-[#FF6B9D]/20 text-[#FF6B9D]'
                          : 'border-[#FF6B9D]/20 bg-[#2A0038]/60 text-white hover:border-[#FF6B9D]/50'
                      }`}
                    >
                      <span className="font-bold text-base">{min}</span>
                      <span className="text-[10px] opacity-70">min</span>
                    </motion.button>
                  );
                })}
              </div>

              {sleepTimerEnd && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSleepTimer(null); setOpen(false); }}
                  className="w-full py-3 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-medium text-sm"
                >
                  Cancel Timer {remaining !== null ? `(${fmt(remaining)} left)` : ''}
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
