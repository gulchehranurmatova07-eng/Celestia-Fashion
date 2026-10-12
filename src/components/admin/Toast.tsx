"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; message: string; ok: boolean };
type Push = (message: string, ok?: boolean) => void;

const ToastCtx = createContext<Push>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback<Push>(
    (message, ok = true) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t.slice(-3), { id, message, ok }]);
      window.setTimeout(() => dismiss(id), ok ? 4500 : 9000);
    },
    [dismiss],
  );
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.ok ? "status" : "alert"}
            className={`pointer-events-auto flex items-start justify-between gap-3 border bg-white px-4 py-3 text-sm ${
              t.ok ? "border-obsidian" : "border-[#9B1C1C] text-[#9B1C1C]"
            }`}
          >
            <span>{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} className="text-xs uppercase tracking-wide2" aria-label="Dismiss notification">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
