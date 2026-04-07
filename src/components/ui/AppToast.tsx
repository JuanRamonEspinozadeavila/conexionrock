"use client";

import { useEffect } from "react";

type AppToastProps = {
  message: string | null;
  onClose: () => void;
  duration?: number;
};

export default function AppToast({
  message,
  onClose,
  duration = 2500,
}: AppToastProps) {
  useEffect(() => {
    if (!message?.trim()) return;

    const timeout = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [message, duration, onClose]);

  if (!message?.trim()) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[100] sm:right-6">
      <div className="pointer-events-auto min-w-[220px] max-w-sm rounded-xl border border-white/10 bg-neutral-900/95 px-4 py-3 shadow-2xl backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-white">{message}</p>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-xs text-neutral-400 transition hover:text-white"
            aria-label="Cerrar notificación"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}