"use client";

import { useEffect, useRef } from "react";
import type { Segment } from "@/lib/cuts";

type Props = {
  peaks: number[];
  duration: number;
  time: number;
  cuts: Segment[];
  onSeek: (t: number) => void;
};

const HEIGHT = 120;

export function Waveform({ peaks, duration, time, cuts, onSeek }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = wrap.clientWidth;
      canvas.width = Math.round(width * dpr);
      canvas.height = HEIGHT * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${HEIGHT}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx || duration <= 0) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, HEIGHT);

      const x = (t: number) => (t / duration) * width;

      // Zones coupées
      ctx.fillStyle = "rgba(27, 42, 88, 0.10)";
      for (const c of cuts) ctx.fillRect(x(c.start), 0, Math.max(1, x(c.end) - x(c.start)), HEIGHT);

      // Barres
      const bar = 3;
      const gap = 1;
      const count = Math.floor(width / (bar + gap));
      const mid = HEIGHT / 2;
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, "#3f7cf6");
      grad.addColorStop(1, "#3ad0f5");
      for (let i = 0; i < count; i++) {
        const t0 = (i / count) * duration;
        const t1 = ((i + 1) / count) * duration;
        const p0 = Math.floor((i / count) * peaks.length);
        const p1 = Math.max(p0 + 1, Math.floor(((i + 1) / count) * peaks.length));
        let v = 0;
        for (let p = p0; p < p1 && p < peaks.length; p++) v = Math.max(v, peaks[p]);
        const h = Math.max(2, v * (HEIGHT - 16));
        const center = (t0 + t1) / 2;
        const inCut = cuts.some((c) => center >= c.start && center < c.end);
        const played = t1 <= time;
        ctx.fillStyle = inCut ? "rgba(107, 104, 128, 0.35)" : played ? "#2b2358" : grad;
        ctx.fillRect(i * (bar + gap), mid - h / 2, bar, h);
      }

      // Tête de lecture
      ctx.fillStyle = "#f0508a";
      ctx.fillRect(x(time) - 1, 0, 2, HEIGHT);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [peaks, duration, time, cuts]);

  function handlePointer(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(((e.clientX - rect.left) / rect.width) * duration);
  }

  return (
    <div
      ref={wrapRef}
      onPointerDown={handlePointer}
      onPointerMove={(e) => {
        if (e.buttons === 1) handlePointer(e);
      }}
      role="slider"
      aria-label="Position de lecture"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(time)}
      style={{ background: "#fff", border: "1px solid var(--bord)", borderRadius: 18, padding: "8px 0", cursor: "pointer", touchAction: "none" }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
