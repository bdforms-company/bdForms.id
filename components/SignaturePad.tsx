"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface SignaturePadHandle {
  toJPEG: (quality?: number) => string; // dataURL JPEG base64
  clear: () => void;
  isEmpty: () => boolean;
}

// Resolusi internal canvas (di-scale CSS ke lebar container)
const W = 600;
const H = 200;

export const SignaturePad = forwardRef<SignaturePadHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  const fillWhite = (ctx: CanvasRenderingContext2D) => {
    // JPEG gak punya transparansi -> wajib kasih background putih
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    fillWhite(ctx);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111111";
  }, []);

  // konversi posisi pointer -> koordinat canvas (handle scaling responsif)
  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height),
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    drawing.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current!.setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    dirty.current = true;
  };

  const end = () => {
    drawing.current = false;
  };

  useImperativeHandle(ref, () => ({
    toJPEG: (quality = 0.3) =>
      canvasRef.current!.toDataURL("image/jpeg", quality),
    clear: () => {
      const ctx = canvasRef.current!.getContext("2d")!;
      fillWhite(ctx);
      dirty.current = false;
    },
    isEmpty: () => !dirty.current,
  }));

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerLeave={end}
      style={{
        touchAction: "none", // cegah scroll saat gambar di HP
        width: "100%",
        height: "auto",
        border: "1px solid #ccc",
        borderRadius: 8,
        background: "#fff",
        cursor: "crosshair",
      }}
    />
  );
});

SignaturePad.displayName = "SignaturePad";
