import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Star, Home as HomeIcon, User as UserIcon } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import PropertyCard from "../components/PropertyCard";
import { useProperties } from "../context/PropertiesContext";
import { useToast } from "../context/ToastContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ROLE_CONFIG = {
  AGENTE:   { label: "Agente",   Icon: Star,        bg: "from-amber-500 to-orange-500"  },
  VENDEDOR: { label: "Vendedor", Icon: HomeIcon,    bg: "from-green-500 to-emerald-600" },
  ADMIN:    { label: "Admin",    Icon: ShieldCheck, bg: "from-purple-500 to-purple-600" },
  CLIENTE:  { label: "Cliente",  Icon: UserIcon,    bg: "from-blue-500 to-blue-600"     },
};

function Stars({ value }) {
  const rounded = Math.round(value);
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          strokeWidth={1.75}
          fill={n <= rounded ? "currentColor" : "none"}
          className={n <= rounded ? "text-amber-400" : "text-gray-300 dark:text-gray-600"}
        />
      ))}
    </span>
  );
}

const normalizeProperty = (p) => ({
  ...p,
  type:   { APARTAMENTO: "Apartamento", CASA: "Casa", VILLA: "Villa" }[p.type] || p.type,
  status: { VENTA: "Venta", RENTA: "Renta", VENDIDO: "Vendido", RENTADO: "Rentado" }[p.status] || p.status,
  image:  p.images?.[0] || "",
});

export default function AgentProfile() {
  const { id } = useParams();
  const { toggleFavorite, isFavorite } = useProperties();
  const { toast } = useToast();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setError("");
    fetch(`${API_URL}/api/users/${id}`)
      .then((res) => res.ok ? res.json() : Promise.reject(res.status))
      .then((d) => setData(d))
      .catch(() => setError("No se pudo cargar este perfil."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-400">Cargando perfil...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <p className="text-6xl mb-4">🏚️</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mb-2">Perfil no encontrado</p>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition">
            🏠 Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const { user, stats, properties } = data;
  const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.CLIENTE;
  const memberSince = new Date(user.createdAt).toLocaleDateString("es-DO", { month: "long", year: "numeric" });
  const normalized = properties.map(normalizeProperty);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Seo
        title={`${user.name} — ${roleConfig.label} en Domify`}
        description={`Propiedades publicadas por ${user.name} en Domify.${stats.avgRating ? ` ${stats.avgRating}★ (${stats.reviewsCount} reseñas).` : ""}`}
        path={`/agent/${user.id}`}
        image={user.avatar}
      />
      <Navbar />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto px-4 py-8"
      >
        {/* ── CABECERA ── */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-28 h-28 rounded-3xl object-cover shadow-md flex-shrink-0" />
          ) : (
            <div className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${roleConfig.bg} flex items-center justify-center text-white text-4xl font-black shadow-md flex-shrink-0`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">{user.name}</h1>
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full text-white bg-gradient-to-r ${roleConfig.bg}`}>
                <roleConfig.Icon size={11} strokeWidth={2.5} /> {roleConfig.label}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">Miembro desde {memberSince}</p>

            {/* Ranking */}
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
              {stats.avgRating ? (
                <>
                  <Stars value={stats.avgRating} />
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{stats.avgRating}</span>
                  <span className="text-gray-400 text-sm">
                    ({stats.reviewsCount} reseña{stats.reviewsCount !== 1 ? "s" : ""})
                  </span>
                </>
              ) : (
                <span className="text-gray-400 text-sm">Sin reseñas todavía</span>
              )}
            </div>

            {/* Stats rápidas */}
            <div className="flex items-center justify-center sm:justify-start gap-5 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{stats.propertiesCount}</p>
                <p className="text-gray-400 text-xs mt-1">Propiedades</p>
              </div>
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{stats.reviewsCount}</p>
                <p className="text-gray-400 text-xs mt-1">Reseñas</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── PUBLICACIONES ── */}
        <div className="mt-8">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full" />
            Propiedades publicadas
          </h2>

          {normalized.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-10 text-center text-gray-400">
              Todavía no ha publicado propiedades.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {normalized.map((prop, i) => (
                <PropertyCard
                  key={prop.id}
                  prop={prop}
                  index={i}
                  toggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                  toast={toast}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <Footer />
    </div>
  );
}
