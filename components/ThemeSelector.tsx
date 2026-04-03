import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Palette, Check } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';

const THEMES = [
  { id: 'sakura',    label: 'Sakura Pink',    jp: 'さくら',   from: '#FF6B9D', to: '#C2185B',  bg: '#0A000F' },
  { id: 'moonlight', label: 'Moonlight',       jp: '月光',    from: '#A855F7', to: '#6D28D9',  bg: '#070010' },
  { id: 'ocean',     label: 'Ocean Blue',      jp: '海',      from: '#06B6D4', to: '#0284C7',  bg: '#000A10' },
  { id: 'cherry',    label: 'Cherry Red',      jp: '紅',      from: '#EF4444', to: '#B91C1C',  bg: '#100000' },
  { id: 'midnight',  label: 'Midnight',        jp: '深夜',    from: '#6366F1', to: '#4338CA',  bg: '#020010' },
] as const;

export const ThemeSelectorButton: React.FC = () => {
  const { appTheme, setAppTheme } = usePlayerStore();
  const [open, setOpen] = useState(false);
  const current = THEMES.find(t => t.id === appTheme) || THEMES[0];

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-[#FF6B9D]/10 transition-all group"
      >
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${current.from}, ${current.to})` }}>
          <Palette size={16} className="text-white" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-white font-medium text-sm">App Theme</span>
          <span className="text-[#D4A0BA] text-xs">{current.label}</span>
        </div>
        <div className="ml-auto w-4 h-4 rounded-full border border-white/20 shrink-0"
          style={{ background: `linear-gradient(135deg, ${current.from}, ${current.to})` }} />
      </motion.button>

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
                  <Palette size={20} className="text-[#FF6B9D]" />
                  <h3 className="text-white font-bold text-lg">Choose Theme</h3>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-white/10">
                  <X size={20} className="text-white/70" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {THEMES.map(theme => {
                  const isActive = appTheme === theme.id;
                  return (
                    <motion.button
                      key={theme.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setAppTheme(theme.id as any); setOpen(false); }}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        isActive
                          ? 'border-opacity-60 bg-white/5'
                          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                      }`}
                      style={{ borderColor: isActive ? theme.from : undefined }}
                    >
                      {/* Color Swatch */}
                      <div className="relative w-12 h-12 rounded-xl shrink-0 overflow-hidden shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-xs font-bold"
                            style={{ fontFamily: 'Noto Serif JP, serif' }}>{theme.jp}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-start">
                        <span className="text-white font-bold text-sm">{theme.label}</span>
                        <span className="text-white/40 text-xs mt-0.5">{theme.from}</span>
                      </div>

                      {isActive && (
                        <div className="ml-auto w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
                          <Check size={14} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
