"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let idCounter = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((toast) => {
    const id = idCounter++;
    const next = { id, ...toast };
    setToasts((t) => [...t, next]);
    if (!toast.sticky) setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), toast.duration || 4000);
    return id;
  }, []);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto max-w-sm rounded-lg px-4 py-3 shadow-lg ${t.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                {t.title && <div className="font-semibold">{t.title}</div>}
                <div className="text-sm">{t.message}</div>
              </div>
              <button onClick={() => remove(t.id)} className="ml-4 text-sm opacity-90">×</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      success: (title, message) => console.log('[Toast Success]', title, message),
      error: (title, message) => console.error('[Toast Error]', title, message),
      push: () => 0,
      remove: () => {},
    };
  }
  return {
    success: (title, message, opts = {}) => ctx.push({ type: 'success', title, message, ...opts }),
    error: (title, message, opts = {}) => ctx.push({ type: 'error', title, message, ...opts }),
    push: ctx.push,
    remove: ctx.remove,
  };
}
