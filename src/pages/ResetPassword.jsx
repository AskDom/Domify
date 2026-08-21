import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import Footer from "../components/Footer";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ResetPassword() {
  // El token viene en el fragment (#token=...) en vez de query param (?token=...).
  // Los fragments nunca se envían al servidor ni en Referer headers, protegiendo
  // el token de reseteo contra filtración en logs de acceso o proxies.
  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/[#&]token=([^&]+)/);
    if (match) {
      setToken(match[1]);
    } else {
      setTokenError(true);
    }
  }, []);
  const navigate = useNavigate();
  const { banner } = useToast();

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const inputClass = "w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm";

  if (tokenError || !token) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Enlace inválido</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              Este enlace de recuperación no es válido. Solicita uno nuevo.
            </p>
            <Link to="/forgot-password" className="inline-block mt-6 text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline">
              Solicitar nuevo enlace →
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 5) {
      setError("La contraseña debe tener al menos 5 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo restablecer la contraseña.");
        return;
      }
      banner({
        message:  "¡Contraseña actualizada! 🎉",
        subtitle: "Ya puedes iniciar sesión con tu nueva contraseña",
        type:     "success",
      });
      navigate("/");
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
      <Seo title="Restablecer contraseña" noindex />
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
        <h1 className="text-xl font-black text-gray-900 dark:text-white mt-4">Elige tu nueva contraseña</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-11`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                {showPass ? <EyeOff size={17} strokeWidth={2.25} /> : <Eye size={17} strokeWidth={2.25} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
              Confirmar contraseña
            </label>
            <input
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: loading ? "#6b7280" : "linear-gradient(135deg, #1a56db 0%, #0ea5e9 100%)" }}
          >
            {loading ? "Guardando..." : "Restablecer contraseña"}
          </button>
        </form>
      </motion.div>
      </div>
      <Footer />
    </div>
  );
}
