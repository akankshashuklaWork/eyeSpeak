'use client';

import { useState } from 'react';

// 5-point calibration: center + four corners, inset from the edges so the
// targets are comfortably reachable with eye movement alone.
const POINTS = [
  { x: 0.5, y: 0.5 },
  { x: 0.08, y: 0.1 },
  { x: 0.92, y: 0.1 },
  { x: 0.08, y: 0.9 },
  { x: 0.92, y: 0.9 },
];

export default function GazeCalibration({ rawRatioRef, onComplete }) {
  const [index, setIndex] = useState(0);
  const [samples, setSamples] = useState([]);

  const point = POINTS[index];

  function handleCapture() {
    const ratio = rawRatioRef.current;
    const screen = { x: point.x * window.innerWidth, y: point.y * window.innerHeight };
    const next = [...samples, { ratio: { x: ratio.x, y: ratio.y }, screen }];

    if (index + 1 < POINTS.length) {
      setSamples(next);
      setIndex(index + 1);
    } else {
      onComplete(next);
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="fixed left-1/2 top-10 z-10 w-[min(90vw,26rem)] -translate-x-1/2 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-center shadow-2xl backdrop-blur-xl">
        <p className="text-lg font-semibold text-white">Calibrate your gaze</p>
        <p className="mt-1 text-sm text-white/60">
          Look at the glowing dot, then click it. {index + 1} of {POINTS.length}.
        </p>
      </div>

      <button
        onClick={handleCapture}
        aria-label="Calibration target"
        className="fixed h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_28px_10px_rgba(34,211,238,0.55)] transition-transform hover:scale-110 active:scale-95"
        style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
      >
        <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-cyan-300/60" />
      </button>

      <div className="fixed bottom-10 left-1/2 flex -translate-x-1/2 gap-2">
        {POINTS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-6 rounded-full transition-colors ${i <= index ? 'bg-cyan-300' : 'bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
}
