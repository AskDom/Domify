import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ToastContext = createContext();

const ICONS = {
  success: "✅",
  error:   "❌",
  info:    "ℹ️",
  warning: "⚠️",
};

const COLORS = {
  success: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200",
  error:   "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200",
  info:    "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200",
  warning: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200",
};

// Toast grande tipo "banner" para eventos importantes (publicar propiedad, login, etc.)
const BANNER_COLORS = {
  success: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
  error:   "bg-gradient-to-r from-red-500 to-rose-500 text-white",
  info:    "bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
  warning: "bg-gradient-to-r from-amber-400 to-orange-400 text-white",
};

const BANNER_ICONS = {
  success: "🎉",
  error:   "❌",
  info:    "📢",
  warning: "⚠️",
};

export function ToastProvider({ children }) {
  const [toasts,   setToasts]   = useState([]);
  const [banners,  setBanners]  = useState([]);

  // Toast pequeño — esquina inferior derecha (para mensajes rápidos)
  const toast = useCallback(({ message, type = "success", duration = 3500 }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  // Banner grande — centrado arriba (para eventos importantes: publicar, login, logout)
  const banner = useCallback(({ message, subtitle, type = "success", duration = 4000 }) => {
    const id = Date.now();
    setBanners((prev) => [...prev, { id, message, subtitle, type }]);
    setTimeout(() => setBanners((prev) => prev.filter((b) => b.id !== id)), duration);
  }, []);

  const removeToast  = (id) => setToasts((prev)  => prev.filter((t) => t.id !== id));
  const removeBanner = (id) => setBanners((prev)  => prev.filter((b) => b.id !== id));

  return (
    <ToastContext.Provider value={{ toast, banner }}>
      {children}

      {/* BANNERS — centrados arriba, para eventos importantes */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 items-center pointer-events-none" style={{ minWidth: 320 }}>
        <AnimatePresence>
          {banners.map((b) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: -24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0,   scale: 1    }}
              exit={{    opacity: 0, y: -16,  scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl ${BANNER_COLORS[b.type]}`}
              style={{ minWidth: 320, maxWidth: 480 }}
            >
              <span className="text-2xl shrink-0">{BANNER_ICONS[b.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base leading-tight">{b.message}</p>
                {b.subtitle && <p className="text-sm opacity-80 mt-0.5 leading-tight">{b.subtitle}</p>}
              </div>
              <button
                onClick={() => removeBanner(b.id)}
                className="text-white/60 hover:text-white transition text-xl leading-none shrink-0"
              >×</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* TOASTS — esquina inferior derecha, para mensajes rápidos */}
      <div className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: 10,  scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-xl backdrop-blur-sm ${COLORS[t.type]}`}
            >
              <span className="text-lg shrink-0 mt-0.5">{ICONS[t.type]}</span>
              <p className="text-sm font-medium leading-5 flex-1">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="text-lg opacity-40 hover:opacity-70 transition shrink-0 leading-none"
              >×</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}