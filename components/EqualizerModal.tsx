import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sliders } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';

const PRESETS: Record<string, [number, number, number]> = {
  'Flat':       [0,   0,   0],
  'Bass Boost': [8,   2,  -2],
  'Treble':     [-2,  2,   8],
  'Vocal':      [-3,  5,   3],
  'Pop':        [3,   4,   3],
  'Rock':       [5,   1,   4],
};

const Slider: React.FC<{
  label: string; value: number; color: string;
  onChange: (v: number) => void;
}> = ({ label, value, color, onChange }) => {
  const pct = ((value + 12) / 24) * 100;
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <div className="relative h-36 w-8 flex items-center justify-center">
        <div className="absolute inset-y-0 w-1.5 rounded-full bg-white/10 left-1/2 -translate-x-1/2" />
        <div
          className="absolute w-1.5 rounded-full left-1/2 -translate-x-1/2 bottom-0 transition-all"
          style={{ height: `${pct}%`, background: `linear-gradient(to top, ${color}, ${color}88)` }}
        />
        <input
          type="range" min={-12} max={12} step={1} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute opacity-0 h-full cursor-pointer"
          style={{ writingMode: 'vertical-lr', direction: 'rtl', width: '32px' }}
        />
        <div
          className="absolute w-5 h-5 rounded-full border-2 shadow-lg transition-all left-1/2 -translate-x-1/2"
          style={{ bottom: `calc(${pct}% - 10px)`, borderColor: color, background: '#0A000F' }}
        />
      </div>
      <span className="text-[11px] font-bold" style={{ color }}>{value > 0 ? '+' : ''}{value}</span>
      <span className="text-[10px] text-white/40 font-medium">{label}</span>
    </div>
  );
};

export const EqualizerButton: React.FC = () => {
  const { equalizerBass, equalizerMid, equalizerTreble, setEqualizer, audioElement } = usePlayerStore();
  const [open, setOpen] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bassRef = useRef<BiquadFilterNode | null>(null);
  const midRef  = useRef<BiquadFilterNode | null>(null);
  const trebleRef = useRef<BiquadFilterNode | null>(null);

  // Apply EQ to Web Audio API
  useEffect(() => {
    if (!audioElement) return;
    try {
      if (!audioCtxRef.current) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const src = ctx.createMediaElementSource(audioElement);
        const bass = ctx.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 250;
        const mid  = ctx.createBiquadFilter(); mid.type  = 'peaking';  mid.frequency.value  = 1000; mid.Q.value = 1;
        const treble = ctx.createBiquadFilter(); treble.type = 'highshelf'; treble.frequency.value = 4000;
        src.connect(bass).connect(mid).connect(treble).connect(ctx.destination);
        audioCtxRef.current = ctx;
        bassRef.current = bass;
        midRef.current = mid;
        trebleRef.current = treble;
      }
      if (bassRef.current) bassRef.current.gain.value = equalizerBass;
      if (midRef.current)  midRef.current.gain.value  = equalizerMid;
      if (trebleRef.current) trebleRef.current.gain.value = equalizerTreble;
    } catch(e) { /* Safari fallback */ }
  }, [equalizerBass, equalizerMid, equalizerTreble, audioElement]);

  const isActive = equalizerBass !== 0 || equalizerMid !== 0 || equalizerTreble !== 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`p-2 rounded-full transition-all ${isActive ? 'text-[#FF6B9D]' : 'text-white/40 hover:text-white'}`}
        title="Equalizer"
      >
        <Sliders size={20} />
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
                  <Sliders size={20} className="text-[#FF6B9D]" />
                  <h3 className="text-white font-bold text-lg">Equalizer</h3>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-white/10">
                  <X size={20} className="text-white/70" />
                </button>
              </div>

              {/* Presets */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
                {Object.entries(PRESETS).map(([name, [b,m,t]]) => {
                  const isActive = b === equalizerBass && m === equalizerMid && t === equalizerTreble;
                  return (
                    <button
                      key={name}
                      onClick={() => setEqualizer(b, m, t)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        isActive ? 'bg-[#FF6B9D]/20 border-[#FF6B9D] text-[#FF6B9D]' : 'border-[#FF6B9D]/20 text-white/60 hover:border-[#FF6B9D]/50'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>

              {/* Sliders */}
              <div className="flex items-end justify-around px-4">
                <Slider label="Bass" value={equalizerBass} color="#FF6B9D"
                  onChange={v => setEqualizer(v, equalizerMid, equalizerTreble)} />
                <Slider label="Mid"  value={equalizerMid}  color="#FFB7C5"
                  onChange={v => setEqualizer(equalizerBass, v, equalizerTreble)} />
                <Slider label="Treble" value={equalizerTreble} color="#C2185B"
                  onChange={v => setEqualizer(equalizerBass, equalizerMid, v)} />
              </div>

              <button
                onClick={() => setEqualizer(0, 0, 0)}
                className="mt-6 w-full py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-all"
              >
                Reset to Flat
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
