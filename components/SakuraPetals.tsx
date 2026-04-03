import React, { useEffect, useRef } from 'react';

interface Petal {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
  delay: number;
}

const PETAL_COLORS = ['#FFB7C5','#FF6B9D','#FFCDD2','#F48FB1','#FCE4EC','#FF80AB','#FFD6E0'];

const PetalSVG: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(15,15)">
      {[0,72,144,216,288].map(r => (
        <ellipse key={r} rx="6" ry="11" fill={color} opacity="0.85"
          transform={`rotate(${r}) translate(0,-9)`}/>
      ))}
      <circle r="3.5" fill="white" opacity="0.6"/>
    </g>
  </svg>
);

export const SakuraPetals: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const petalsRef = useRef<Petal[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    // Create 12 petals
    petalsRef.current = Array.from({length: 12}, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 60,
      size: 12 + Math.random() * 14,
      speed: 0.4 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1.5,
      opacity: 0.5 + Math.random() * 0.4,
      color: PETAL_COLORS[i % PETAL_COLORS.length],
      delay: Math.random() * 8000,
    }));

    const container = containerRef.current;
    if (!container) return;

    // Create DOM elements for each petal
    petalsRef.current.forEach(petal => {
      const el = document.createElement('div');
      el.id = `sakura-petal-${petal.id}`;
      el.style.cssText = `position:absolute;pointer-events:none;will-change:transform;opacity:0;transition:opacity 1s;`;
      el.innerHTML = `<svg width="${petal.size}" height="${petal.size}" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><g transform="translate(15,15)">${
        [0,72,144,216,288].map(r => `<ellipse rx="6" ry="11" fill="${petal.color}" opacity="0.85" transform="rotate(${r}) translate(0,-9)"/>`).join('')
      }<circle r="3.5" fill="white" opacity="0.6"/></g></svg>`;
      container.appendChild(el);
    });

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = Math.min(time - lastTimeRef.current, 50);
      lastTimeRef.current = time;

      petalsRef.current.forEach((petal, i) => {
        if (time < petal.delay) return;

        petal.y += petal.speed * (delta / 16);
        petal.x += petal.drift * (delta / 16);
        petal.rotation += petal.rotationSpeed * (delta / 16);

        // Reset when off screen
        if (petal.y > 108) {
          petal.y = -8;
          petal.x = Math.random() * 100;
          petal.delay = 0;
        }

        const el = document.getElementById(`sakura-petal-${i}`);
        if (el) {
          el.style.opacity = String(petal.opacity);
          el.style.transform = `translate(${petal.x}vw, ${petal.y}vh) rotate(${petal.rotation}deg)`;
        }
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (container) container.innerHTML = '';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  );
};
