"use client";

import { useEffect, useRef } from "react";

export default function NoiseBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = 0.5;
    let w = Math.ceil(window.innerWidth / scale);
    let h = Math.ceil(window.innerHeight / scale);
    canvas.width = w;
    canvas.height = h;

    let imageData = ctx.createImageData(w, h);
    let animationId: number;

    const handleResize = () => {
      w = Math.ceil(window.innerWidth / scale);
      h = Math.ceil(window.innerHeight / scale);
      canvas.width = w;
      canvas.height = h;
      imageData = ctx.createImageData(w, h);
    };

    const fps = 20;
    const interval = 1000 / fps;
    let lastTime = 0;

    const draw = (time: number) => {
      animationId = requestAnimationFrame(draw);
      if (time - lastTime < interval) return;
      lastTime = time;

      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < 0.9) {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
        } else {
          // 各チャンネル独立: 0〜60の範囲で、1〜2チャンネルが0になりやすい
          data[i] = Math.random() < 0.4 ? 0 : Math.random() * 60;
          data[i + 1] = Math.random() < 0.4 ? 0 : Math.random() * 60;
          data[i + 2] = Math.random() < 0.4 ? 0 : Math.random() * 60;
        }
        data[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
    };

    window.addEventListener("resize", handleResize);
    animationId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "pointer-events-none fixed inset-0 -z-10 h-full w-full"}
      style={{ imageRendering: "auto" }}
    />
  );
}
