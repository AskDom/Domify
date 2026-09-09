import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Circle, Tooltip, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Search, X } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import PropertyCardSkeleton from "../components/PropertyCardSkeleton";
import PropertyCard from "../components/PropertyCard";
import { useProperties } from "../context/PropertiesContext";
import { useAuth } from "../context/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useToast } from "../context/ToastContext";
import { formatPriceShort, toUsdEquivalent } from "../utils/formatPrice";
import PriceTag from "../components/PriceTag";
import { formatLocation } from "../utils/formatLocation";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

// Ícono de cluster con la misma paleta que los pines individuales — sin esto
// leaflet.markercluster dibuja círculos amarillo/naranja por defecto.
function clusterIcon(cluster) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 34 : count < 100 ? 42 : 50;
  return L.divIcon({
    className: "",
    html: `<div style="background:#111827;color:white;width:100%;height:100%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.25);border:2px solid white">${count}</div>`,
    iconSize: L.point(size, size),
  });
}

// Ícono de precio en el mapa
function createPriceIcon(price, status, isActive, currency) {
  const formatted = formatPriceShort(price, currency);
  const bg = isActive ? "#1a56db" : status === "Renta" ? "#059669" : "#111827";
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:white;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25);border:2px solid white;transform:${isActive ? "scale(1.12)" : "scale(1)"};transition:all 0.2s">${formatted}</div><div style="width:8px;height:8px;background:${bg};margin:-1px auto 0;clip-path:polygon(0 0,100% 0,50% 100%)"></div>`,
    iconSize: [72, 36], iconAnchor: [36, 36], popupAnchor: [0, -38],
  });
}

// Sin sesión no mostramos el pin exacto (mismo criterio que SearchResults) —
// redondeamos a una cuadrícula de ~1km y dibujamos una zona en vez de un punto.
function approxZoneCenter(lat, lng) {
  const round = (n) => Math.round(n * 100) / 100;
  return [round(lat), round(lng)];
}

// Ajusta el mapa a los bounds de las propiedades
function MapFit({ properties }) {
  const map = useMap();
  useEffect(() => {
    if (!properties.length) return;
    const valid = properties.filter(p => p.lat && p.lng);
    if (!valid.length) return;
    if (valid.length === 1) { map.setView([valid[0].lat, valid[0].lng], 14); return; }
    const bounds = L.latLngBounds(valid.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [48, 48] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.length]);
  return null;
}

const PROVINCIAS = [
  "Santo Domingo", "Santiago", "Punta Cana", "Samaná",
  "Jarabacoa", "La Romana", "Baní", "San Cristóbal",
];

const TAB_TO_FILTER = {
  "Todos":        {},
  "Apartamentos": { type: "APARTAMENTO" },
  "Casas":        { type: "CASA" },
  "Villas":       { type: "VILLA" },
  "En Venta":     { status: "VENTA" },
  "En Renta":     { status: "RENTA" },
};

const SORT_OPTIONS = [
  { value: "recent",     label: "Más recientes" },
  { value: "price_asc",  label: "Menor precio"  },
  { value: "price_desc", label: "Mayor precio"  },
];

function sortProperties(props, sort) {
  const arr = [...props];
  // Comparamos el equivalente en USD, no el número crudo — si no, una
  // propiedad en RD$5,000,000 se ordenaba como "más cara" que una en
  // US$95,000 aunque en dólares reales sea al revés.
  if (sort === "price_asc")  return arr.sort((a, b) => toUsdEquivalent(a.price, a.currency) - toUsdEquivalent(b.price, b.currency));
  if (sort === "price_desc") return arr.sort((a, b) => toUsdEquivalent(b.price, b.currency) - toUsdEquivalent(a.price, a.currency));
  return arr.sort((a, b) => {
    if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
    return b.id > a.id ? 1 : -1;
  });
}

// ── HERO SLIDES ───────────────────────────────────────────────────────────────
const HERO_SLIDES = [
  {
    url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1800&q=80",
    title: "Villas de lujo",
    sub: "en Cap Cana y Casa de Campo",
  },
  {
    url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1800&q=80",
    title: "Apartamentos modernos",
    sub: "en Piantini, Naco y Serralles",
  },
  {
    url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1800&q=80",
    title: "Casas familiares",
    sub: "en los mejores vecindarios del país",
  },
];

const MAX_HISTORY = 6;

export default function Home() {
  const [query,         setQuery]         = useState("");
  const [sort,          setSort]          = useState("recent");
  const [showHistory,   setShowHistory]   = useState(false);
  const [heroIndex,     setHeroIndex]     = useState(0);
  const [viewMode,      setViewMode]      = useState("grid"); // "grid" | "map"
  const [activePin,     setActivePin]     = useState(null);
  const [searchHistory, setSearchHistory] = useLocalStorage("domify-search-history", []);

  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const { allProperties, toggleFavorite, isFavorite, loading: propertiesLoading, pagination, fetchProperties, loadMore } = useProperties();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const activeTab = searchParams.get("tab") || "Todos";
  const filtered  = sortProperties(allProperties, sort);

  // Auto-slide del hero
  useEffect(() => {
    const t = setInterval(() => setHeroIndex((i) => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Refetch al cambiar tab
  useEffect(() => {
    fetchProperties({ ...(TAB_TO_FILTER[activeTab] || {}), page: 1 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const saveToHistory = (term) => {
    if (!term.trim()) return;
    setSearchHistory((prev) => {
      const f = prev.filter((h) => h.toLowerCase() !== term.toLowerCase());
      return [term, ...f].slice(0, MAX_HISTORY);
    });
  };

  const handleSearch = (term) => {
    const q = term || query;
    if (!q.trim()) return;
    saveToHistory(q.trim());
    setShowHistory(false);
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const handleTabChange = (tab) => {
    navigate(tab === "Todos" ? "/" : `/?tab=${encodeURIComponent(tab)}`);
  };

  const slide = HERO_SLIDES[heroIndex];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Seo
        description="Encontrá apartamentos, casas y villas en venta o renta en toda República Dominicana. Publicá tu propiedad o buscá tu próximo hogar en Domify."
        path="/"
      />
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* ════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════ */}
      <div className="relative" style={{ height: 520 }}>
        {/* Fondo con crossfade — el overflow-hidden queda solo acá, para que
            el dropdown de búsquedas recientes (más abajo) no se corte */}
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence mode="sync">
            <motion.img
              key={slide.url}
              src={slide.url}
              alt="hero"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: "center 60%" }}
            />
          </AnimatePresence>

          {/* Gradientes */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.85) 100%)"
          }}/>
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 60%)"
          }}/>
        </div>

        {/* Contenido */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">

          {/* Badge animado */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 mb-5"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"/>
            <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">
              República Dominicana
            </span>
          </motion.div>

          {/* Título con slide animado */}
          <div className="overflow-hidden mb-2">
            <AnimatePresence mode="wait">
              <motion.h1
                key={heroIndex}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-xl"
              >
                {slide.title}
              </motion.h1>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={`sub-${heroIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-blue-200 text-base md:text-lg mb-8"
            >
              {slide.sub}
            </motion.p>
          </AnimatePresence>

          {/* Buscador */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full max-w-2xl relative"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-2 flex gap-2 border border-white/20">
              <span className="flex items-center pl-3 text-gray-400"><Search size={18} strokeWidth={2.25} /></span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowHistory(true)}
                onBlur={() => setTimeout(() => setShowHistory(false), 150)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Busca por ciudad, sector o provincia..."
                className="flex-1 px-3 py-3 outline-none bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 text-sm"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSearch()}
                className="text-white px-6 py-3 rounded-xl font-bold text-sm transition shrink-0 shadow-lg"
                style={{ background: "linear-gradient(135deg, #1a56db, #0ea5e9)" }}
              >
                Buscar
              </motion.button>
            </div>

            {/* Historial */}
            <AnimatePresence>
              {showHistory && searchHistory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                >
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Búsquedas recientes</p>
                    <button onMouseDown={() => setSearchHistory([])} className="text-xs text-red-500 hover:text-red-600 font-medium">Limpiar</button>
                  </div>
                  {searchHistory.map((term) => (
                    <div
                      key={term}
                      onMouseDown={() => handleSearch(term)}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-300 dark:text-gray-600">🕐</span>
                        <span className="text-sm text-gray-700 dark:text-gray-200">{term}</span>
                      </div>
                      <button
                        onMouseDown={(e) => { e.stopPropagation(); setSearchHistory((p) => p.filter((h) => h !== term)); }}
                        className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition"
                      ><X size={14} strokeWidth={2.25} /></button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Provincias */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-2 mt-5 justify-center"
          >
            {PROVINCIAS.map((p) => (
              <button
                key={p}
                onClick={() => handleSearch(p)}
                className="text-white/90 hover:text-white text-xs px-3.5 py-1.5 rounded-full border border-white/25 hover:border-white/50 hover:bg-white/15 transition backdrop-blur-sm"
              >
                {p}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Stats bottom-right */}
        <div className="absolute bottom-6 right-6 hidden md:flex gap-8">
          {[["2,400+", "Propiedades"], ["180+", "Agentes"], ["12", "Ciudades"]].map(([n, l]) => (
            <div key={l} className="text-center">
              <p className="font-black text-white text-2xl leading-none">{n}</p>
              <p className="text-white/60 text-xs mt-0.5">{l}</p>
            </div>
          ))}
        </div>

        {/* Dots del slideshow */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              className="transition-all rounded-full"
              aria-label={`Ir a diapositiva ${i + 1}`}
              style={{
                width: i === heroIndex ? 24 : 8,
                height: 8,
                background: i === heroIndex ? "#60a5fa" : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          FEED
      ════════════════════════════════════════════════════════════ */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              {activeTab === "Todos" ? "Propiedades destacadas" : activeTab}
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {propertiesLoading ? "Cargando..." : `${pagination.total || filtered.length} propiedades disponibles`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {viewMode === "grid" && (
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                    {o.label}
                  </option>
                ))}
              </select>
            )}
            {/* Toggle vista */}
            <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                title="Vista cuadrícula"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "grid"
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
                Lista
              </button>
              <button
                onClick={() => setViewMode("map")}
                title="Vista mapa"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "map"
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Mapa
              </button>
            </div>
          </div>
        </div>

        {/* VISTA CUADRÍCULA */}
        <AnimatePresence mode="wait">
        {viewMode === "grid" && (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {propertiesLoading ? (
              [...Array(8)].map((_, i) => <PropertyCardSkeleton key={i} />)
            ) : filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full text-center py-20"
              >
                <p className="text-6xl mb-4">🏚️</p>
                <p className="text-gray-500 dark:text-gray-400 font-semibold text-lg">No hay propiedades en esta categoría</p>
                <button onClick={() => handleTabChange("Todos")} className="mt-4 text-blue-600 font-semibold text-sm hover:underline">
                  Ver todas las propiedades
                </button>
              </motion.div>
            ) : (
              filtered.map((prop, i) => (
                <PropertyCard
                  key={prop.id}
                  prop={prop}
                  index={i}
                  toggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                  toast={toast}
                />
              ))
            )}
          </motion.div>
        )}

        {/* VISTA MAPA */}
        {viewMode === "map" && (
          <motion.div
            key="map"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md"
            style={{ height: 620 }}
          >
            {propertiesLoading ? (
              <div className="w-full h-full bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center">
                <p className="text-gray-400 text-sm">Cargando mapa...</p>
              </div>
            ) : (
              <MapContainer
                center={[18.7357, -70.1627]}
                zoom={8}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                <MapFit properties={filtered.filter(p => p.lat && p.lng)} />
                {(() => {
                  const visible = filtered.filter(p => p.lat && p.lng);
                  const popupFor = (prop) => (
                    <Popup>
                      <div className="text-sm min-w-[180px]">
                        {prop.image && (
                          <img src={prop.image} alt={prop.title}
                            className="w-full h-28 object-cover rounded-xl mb-2"/>
                        )}
                        <div className="flex gap-1.5 mb-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            prop.status === "Venta" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                          }`}>{prop.status}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">{prop.type}</span>
                        </div>
                        <p className="font-bold text-gray-900 leading-snug text-sm">{prop.title}</p>
                        <p className="text-blue-600 font-black mt-1">
                          <PriceTag price={prop.price} currency={prop.currency} />
                          {prop.status === "Renta" && <span className="text-gray-400 font-normal text-xs">/mes</span>}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">📍 {formatLocation(prop.city, prop.sector)}</p>
                        <div className="flex gap-2 mt-1.5 text-xs text-gray-500">
                          <span>🛏 {prop.rooms}</span>
                          <span>🛁 {prop.baths}</span>
                          {prop.parking > 0 && <span>🚗 {prop.parking}</span>}
                        </div>
                        <a href={`/property/${prop.id}`}
                          className="block w-full mt-2.5 text-center py-2 rounded-xl text-xs font-bold text-white transition hover:opacity-90"
                          style={{ backgroundColor: "#2563eb", boxShadow: "0 2px 6px rgba(37,99,235,0.4)" }}>
                          Ver detalles →
                        </a>
                        {!currentUser && (
                          <p className="text-[11px] text-gray-400 mt-2">
                            Zona aproximada — inicia sesión para ver la ubicación exacta.
                          </p>
                        )}
                      </div>
                    </Popup>
                  );

                  // Agrupados igual que en SearchResults: con muchas propiedades
                  // visibles, un Marker de DOM por cada una congela el mapa
                  // (ver prueba de carga — 1 fps con 10k pines sin agrupar).
                  return currentUser ? (
                    <MarkerClusterGroup
                      chunkedLoading
                      maxClusterRadius={60}
                      disableClusteringAtZoom={16}
                      spiderfyOnMaxZoom
                      iconCreateFunction={clusterIcon}
                    >
                      {visible.map((prop) => (
                        <Marker
                          key={prop.id}
                          position={[prop.lat, prop.lng]}
                          icon={createPriceIcon(prop.price, prop.status, activePin === prop.id, prop.currency)}
                          eventHandlers={{
                            mouseover: () => setActivePin(prop.id),
                            mouseout:  () => setActivePin(null),
                          }}
                        >
                          {popupFor(prop)}
                        </Marker>
                      ))}
                    </MarkerClusterGroup>
                  ) : visible.map((prop) => (
                    // Zonas aproximadas: son Circle, no Marker, el plugin de
                    // clustering no las agrupa — se quedan sueltas como antes.
                    <Circle
                      key={prop.id}
                      center={approxZoneCenter(prop.lat, prop.lng)}
                      radius={900}
                      pathOptions={{ color: "#1a56db", weight: 1, fillColor: "#1a56db", fillOpacity: 0.15 }}
                      eventHandlers={{
                        mouseover: () => setActivePin(prop.id),
                        mouseout:  () => setActivePin(null),
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent>
                        <span className="font-bold">
                          {formatPriceShort(prop.price, prop.currency)}
                        </span>
                      </Tooltip>
                      {popupFor(prop)}
                    </Circle>
                  ));
                })()}
              </MapContainer>
            )}
          </motion.div>
        )}
        </AnimatePresence>

        {/* Cargar más — solo en vista cuadrícula */}
        {viewMode === "grid" && pagination.hasMore && (
          <div className="flex justify-center mt-10">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => loadMore(TAB_TO_FILTER[activeTab] || {})}
              disabled={propertiesLoading}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-10 py-3.5 rounded-2xl font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
              {propertiesLoading ? "Cargando..." : `Cargar más · ${pagination.total - allProperties.length} restantes`}
            </motion.button>
          </div>
        )}
        {viewMode === "grid" && !pagination.hasMore && allProperties.length > 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            Mostrando todas las propiedades ({pagination.total})
          </p>
        )}
      </div>

      <Footer />
    </div>
  );
}