import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, X, Download, Copy, Check } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { getImageUrl } from '../services/api';

export const NowPlayingShareButton: React.FC = () => {
  const { currentSong, isPlaying } = usePlayerStore();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cardUrl, setCardUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !currentSong) return;
    generateCard();
  }, [open, currentSong]);

  const generateCard = async () => {
    if (!currentSong || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 340;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 600, 340);
    bg.addColorStop(0, '#1E0030');
    bg.addColorStop(1, '#0A000F');
    ctx.fillStyle = bg;
    ctx.roundRect(0, 0, 600, 340, 24);
    ctx.fill();

    // Pink glow
    const glow = ctx.createRadialGradient(520, 60, 0, 520, 60, 200);
    glow.addColorStop(0, 'rgba(255,107,157,0.25)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 600, 340);

    // Album art
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => {
        img.onload = res; img.onerror = rej;
        img.src = getImageUrl(currentSong.image);
      });
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(32, 32, 130, 130, 16);
      ctx.clip();
      ctx.drawImage(img, 32, 32, 130, 130);
      ctx.restore();
    } catch {}

    // Song info
    ctx.fillStyle = 'white';
    ctx.font = 'bold 28px DM Sans, sans-serif';
    ctx.fillText(currentSong.name.slice(0, 28) + (currentSong.name.length > 28 ? '…' : ''), 184, 72);

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '18px DM Sans, sans-serif';
    const artist = currentSong.artists?.primary?.[0]?.name || '';
    ctx.fillText(artist.slice(0, 36), 184, 102);

    ctx.fillStyle = 'rgba(255,183,197,0.5)';
    ctx.font = '13px DM Sans, sans-serif';
    ctx.fillText(currentSong.album?.name?.slice(0, 40) || '', 184, 130);

    // Sakura branding
    ctx.fillStyle = '#FF6B9D';
    ctx.font = 'bold 14px Noto Serif JP, serif';
    ctx.fillText('🌸 Kawai Sakura', 184, 172);

    // Waveform bars
    const barCount = 28;
    const barW = 4;
    const gap = 5;
    const barX = 184;
    const barY = 200;
    for (let i = 0; i < barCount; i++) {
      const h = 8 + Math.random() * 24;
      const grad = ctx.createLinearGradient(0, barY - h, 0, barY + h);
      grad.addColorStop(0, '#FF6B9D');
      grad.addColorStop(1, '#C2185B');
      ctx.fillStyle = grad;
      ctx.roundRect(barX + i * (barW + gap), barY - h / 2, barW, h, 2);
      ctx.fill();
    }

    // Bottom label
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '12px DM Sans, sans-serif';
    ctx.fillText('kawai-sakura.app • さくら音楽', 32, 318);

    setCardUrl(canvas.toDataURL('image/png'));
  };

  const handleCopy = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(`🌸 Now Playing on Kawai Sakura:\n"${currentSong?.name}" — ${currentSong?.artists?.primary?.[0]?.name}\n${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!cardUrl) return;
    const a = document.createElement('a');
    a.href = cardUrl;
    a.download = `kawai-sakura-${currentSong?.name?.replace(/\s/g,'-')}.png`;
    a.click();
  };

  if (!currentSong) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-full text-white/40 hover:text-white transition-all"
        title="Share Now Playing"
      >
        <Share2 size={20} />
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
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Share2 size={20} className="text-[#FF6B9D]" />
                  <h3 className="text-white font-bold text-lg">Share Now Playing</h3>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-white/10">
                  <X size={20} className="text-white/70" />
                </button>
              </div>

              {/* Hidden canvas for generation */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Share card preview */}
              <div className="rounded-2xl overflow-hidden mb-5 border border-[#FF6B9D]/20 bg-[#1E0030]">
                {cardUrl ? (
                  <img src={cardUrl} alt="Share card" className="w-full" />
                ) : (
                  <div className="h-36 flex items-center justify-center text-[#D4A0BA]/50 text-sm">
                    Generating card...
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCopy}
                  className="flex-1 py-3 rounded-xl border border-[#FF6B9D]/30 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#FF6B9D]/10 transition-all"
                >
                  {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Link Copy Karo'}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDownload}
                  disabled={!cardUrl}
                  className="flex-1 py-3 rounded-xl font-medium text-white text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#FF6B9D,#C2185B)' }}
                >
                  <Download size={16} />
                  Card Download
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
