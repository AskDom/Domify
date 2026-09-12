import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Seo from "../components/Seo";

// Casas flotantes de fondo
const FLOATING_HOUSES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  x: 5 + (i * 13) % 90,
  size: 24 + (i * 7) % 32,
  duration: 6 + (i * 1.3) % 6,
  delay: i * 0.7,
  opacity: 0.04 + (i * 0.008),
}));

export default function NotFound() {
  const navigate = useNavigate();
  const [count, setCount] = useState(5);
  const [cancelled, setCancelled] = useState(false);

  // Countdown para redirigir automáticamente
  useEffect(() => {
    if (cancelled) return;
    if (count <= 0) { navigate("/"); return; }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, cancelled, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1a56db 100%)" }}
    >
      <Seo title="Página no encontrada" noindex />
      {/* Casas flotantes de fondo */}
      {FLOATING_HOUSES.map((h) => (
        <motion.div
          key={h.id}
          className="absolute text-white select-none pointer-events-none"
          style={{ left: `${h.x}%`, bottom: "-10%", fontSize: h.size, opacity: h.opacity }}
          animate={{ y: [0, -window.innerHeight * 1.2] }}
          transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: "linear" }}
        >
          🏠
        </motion.div>
      ))}

      {/* Círculos decorativos */}
      <div className="absolute top-[-120px] right-[-120px] w-96 h-96 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #60a5fa, transparent)" }}/>
      <div className="absolute bottom-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #34d399, transparent)" }}/>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-12"
        >
          <img src="/logo192-dark.png" alt="Domify" className="w-7 h-7 object-contain" />
          <span className="text-white font-black text-xl tracking-tight">Domify</span>
        </motion.div>

        {/* Número 404 */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 200, delay: 0.1 }}
          className="relative mb-4"
        >
          {/* 404 grande */}
          <p className="font-black text-white select-none leading-none"
            style={{ fontSize: "clamp(100px, 22vw, 200px)", opacity: 0.12, letterSpacing: "-8px" }}
          >
            404
          </p>

          {/* Casa animada encima */}
          <motion.div
            animate={{ y: [0, -16, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ fontSize: "clamp(60px, 12vw, 100px)" }}
          >
            🏚️
          </motion.div>
        </motion.div>

        {/* Texto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
            Esta propiedad<br/>
            <span style={{ background: "linear-gradient(135deg, #60a5fa, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              no existe
            </span>
          </h1>
          <p className="text-blue-200 text-base md:text-lg max-w-md mx-auto leading-relaxed">
            La página que buscas fue eliminada, movida o nunca existió. Pero tenemos cientos de propiedades increíbles esperándote.
          </p>
        </motion.div>

        {/* Botones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-wrap gap-3 justify-center mb-10"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link to="/">
              <button
                className="text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #1a56db, #0ea5e9)" }}
              >
                🏠 Ir al inicio
              </button>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <button
              onClick={() => navigate(-1)}
              className="text-white/90 hover:text-white px-8 py-4 rounded-2xl font-bold text-sm border border-white/20 hover:border-white/40 hover:bg-white/10 transition backdrop-blur"
            >
              ← Volver atrás
            </button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link to="/search?q=Santo Domingo">
              <button className="text-white/90 hover:text-white px-8 py-4 rounded-2xl font-bold text-sm border border-white/20 hover:border-white/40 hover:bg-white/10 transition backdrop-blur">
                🔍 Ver propiedades
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Countdown */}
        {!cancelled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col items-center gap-3"
          >
            <p className="text-blue-300/70 text-sm">
              Redirigiendo al inicio en{" "}
              <motion.span
                key={count}
                initial={{ scale: 1.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-black text-white"
              >
                {count}
              </motion.span>
              {" "}segundos ·{" "}
              <button onClick={() => setCancelled(true)} className="underline hover:text-white transition">
                quedarme aquí
              </button>
            </p>

            {/* Barra de progreso */}
            <div className="w-40 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #60a5fa, #34d399)" }}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}