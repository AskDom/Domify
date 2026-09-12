import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import Footer from "../components/Footer";
import PropertyImage from "../components/PropertyImage";
import VerifiedBadge from "../components/VerifiedBadge";
import PriceTag from "../components/PriceTag";
import { formatLocation } from "../utils/formatLocation";
import { useAuth } from "../context/AuthContext";
import { useProperties } from "../context/PropertiesContext";
import { useToast } from "../context/ToastContext";

// SVG Icons — mismos que en Publish y Profile
const BedIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12V7a2 2 0 012-2h14a2 2 0 012 2v5M3 12h18M3 12v5a2 2 0 002 2h14a2 2 0 002-2v-5M7 12V9a1 1 0 011-1h8a1 1 0 011 1v3"/>
  </svg>
);
const BathIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 12a2 2 0 01-2-2V7a2 2 0 012-2h1m15 7a2 2 0 002-2V7a2 2 0 00-2-2h-1M4 12v5a2 2 0 002 2h12a2 2 0 002-2v-5M5 7V5a2 2 0 012-2h1"/>
  </svg>
);
const CarIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="7" width="20" height="13" rx="2"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M9 12h2.5a1.5 1.5 0 010 3H9v-3zm0 0v3"/>
  </svg>
);
const PinIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

function PropertyCard({ prop, index, onRemove }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <Link to={`/property/${prop.id}`}>
        <div
          className="group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 h-full flex flex-col"
          style={{
            boxShadow: hovered ? "0 20px 60px -10px rgba(0,0,0,0.18)" : "0 2px 12px rgba(0,0,0,0.07)",
            transform: hovered ? "translateY(-4px)" : "translateY(0)",
            transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* Imagen */}
          <div className="relative overflow-hidden" style={{ height: 200 }}>
            <PropertyImage
              src={prop.image}
              type={prop.type}
              alt={prop.title}
              className="w-full h-full object-cover"
              style={{
                transform: hovered ? "scale(1.07)" : "scale(1)",
                transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
              }}
            />

            {/* Gradiente */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"/>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-1.5 items-center">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-md ${
                prop.status === "Venta" ? "bg-blue-600 text-white" : "bg-emerald-500 text-white"
              }`}>
                {prop.status}
              </span>
              <span className="bg-white/95 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 px-2.5 py-1 rounded-full text-xs font-semibold shadow">
                {prop.type}
              </span>
              {prop.verified && <VerifiedBadge />}
            </div>

            {/* Botón quitar favorito */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.preventDefault(); onRemove(prop.id); }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: "rgba(255,255,255,0.95)" }}
              title="Quitar de favoritos"
            >
              <Heart size={15} strokeWidth={2.25} fill="currentColor" className="text-red-500" />
            </motion.button>

            {/* Precio flotante */}
            <div className="absolute bottom-3 left-3">
              <div className="bg-white/95 dark:bg-gray-900/90 backdrop-blur rounded-xl px-3 py-1.5 shadow">
                <p className="font-black text-gray-900 dark:text-white text-base leading-none whitespace-nowrap">
                  <PriceTag price={prop.price} currency={prop.currency} />
                  {prop.status === "Renta" && (
                    <span className="text-gray-400 text-[10px] font-medium ml-1">/mes</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 flex flex-col flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
              {prop.title}
            </h3>
            <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
              <PinIcon /> {formatLocation(prop.city, prop.sector)}
            </p>

            {/* Amenidades con SVG */}
            <div className="flex gap-3 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><BedIcon /> {prop.rooms}</span>
              <span className="flex items-center gap-1"><BathIcon /> {prop.baths}</span>
              {prop.parking > 0 && (
                <span className="flex items-center gap-1"><CarIcon /> {prop.parking}</span>
              )}
              {prop.verified && (
                <span className="ml-auto text-emerald-500 font-semibold text-[10px] flex items-center gap-0.5">
                  ✓ Verificada
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Favorites() {
  const { currentUser } = useAuth();
  const { getFavoriteProperties, toggleFavorite } = useProperties();
  const { toast } = useToast();
  const favorites = getFavoriteProperties();

  const handleRemove = (id) => {
    toggleFavorite(id);
    toast({ message: "Eliminado de favoritos", type: "info" });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <p className="text-6xl mb-4">🔒</p>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Inicia sesión para ver tus favoritos</h2>
          <p className="text-gray-400 mb-6 text-sm">Guarda las propiedades que más te gusten y accede a ellas cuando quieras</p>
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="text-white px-6 py-3 rounded-2xl font-semibold shadow-lg"
              style={{ background: "#111827" }}
            >
              Ir al inicio
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 flex flex-col">
      <Seo title="Mis favoritos" noindex />
      <Navbar />

      <div className="flex-1 max-w-screen-2xl mx-auto w-full px-4 md:px-8 py-10">

        {/* Header */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Mis favoritos
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {favorites.length === 0
                ? "No tienes propiedades guardadas"
                : `${favorites.length} propiedad${favorites.length !== 1 ? "es" : ""} guardada${favorites.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          {favorites.length > 0 && (
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                + Explorar más
              </motion.button>
            </Link>
          )}
        </div>

        {/* Estado vacío */}
        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-28 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-7xl mb-6"
            >
              🤍
            </motion.div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
              Aún no tienes favoritos
            </h2>
            <p className="text-gray-400 mb-8 max-w-sm text-sm leading-relaxed">
              Explora propiedades y guarda las que más te gusten tocando el corazón ❤️ en cualquier propiedad
            </p>
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg text-sm"
                style={{ background: "linear-gradient(135deg, #1a56db, #0ea5e9)" }}
              >
                Explorar propiedades →
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {favorites.map((prop, i) => (
                <PropertyCard
                  key={prop.id}
                  prop={prop}
                  index={i}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <Footer />
    </div>
  );
}