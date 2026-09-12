import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import Footer from "../components/Footer";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Ingresa un correo electrónico válido");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/auth/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim() }),
      });
      // Siempre mostramos el mismo mensaje, exista o no la cuenta.
      setSent(true);
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
      <Seo title="Recuperar contraseña" noindex />
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <img src="/logo192.png" alt="Domify" className="block dark:hidden w-7 h-7 object-contain" />
          <img src="/logo192-dark.png" alt="Domify" className="hidden dark:block w-7 h-7 object-contain" />
          <span className="font-black text-xl text-gray-900 dark:text-white">Domify</span>
        </div>

        {sent ? (
          <>
            <h1 className="text-xl font-black text-gray-900 dark:text-white mt-4">Revisa tu correo</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 leading-relaxed">
              Si existe una cuenta asociada a <span className="font-semibold">{email}</span>, te enviamos un
              enlace para restablecer tu contraseña. El enlace expira en 1 hora.
            </p>
            <Link to="/" className="inline-block mt-6 text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline">
              ← Volver al inicio
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-black text-gray-900 dark:text-white mt-4">¿Olvidaste tu contraseña?</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              Ingresa tu correo y te enviaremos un enlace para restablecerla.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm font-medium">
                  ⚠️ {error}
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: loading ? "#6b7280" : "linear-gradient(135deg, #1a56db 0%, #0ea5e9 100%)" }}
              >
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>
            </form>

            <Link to="/" className="inline-block mt-6 text-gray-500 dark:text-gray-400 text-sm hover:underline">
              ← Volver al inicio
            </Link>
          </>
        )}
      </motion.div>
      </div>
      <Footer />
    </div>
  );
}
