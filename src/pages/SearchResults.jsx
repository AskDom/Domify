import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Circle, Tooltip, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { motion } from "framer-motion";
import { Bed, Bath, Car, MapPin, Heart, Search } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import PropertyImage from "../components/PropertyImage";
import PropertyCardSkeleton from "../components/PropertyCardSkeleton";
import VerifiedBadge from "../components/VerifiedBadge";
import PriceTag from "../components/PriceTag";
import { formatLocation } from "../utils/formatLocation";
import { useProperties } from "../context/PropertiesContext";
import { useAuth, CSRF_HEADERS } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatPriceShort } from "../utils/formatPrice";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

// Ícono de cluster con la misma paleta que los pines individuales — sin esto
// leaflet.markercluster dibuja círculos amarillo/naranja por defecto, que no
// pegan con el resto del mapa.
function clusterIcon(cluster) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 34 : count < 100 ? 42 : 50;
  return L.divIcon({
    className: "",
    html: `<div style="background:#2563eb;color:white;width:100%;height:100%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.3);border:2px solid white">${count}</div>`,
    iconSize: L.point(size, size),
  });
}

function createPriceIcon(price, isActive, status, currency) {
  const formatted = formatPriceShort(price, currency);
  const bg = isActive ? "#2563eb" : status === "Renta" ? "#22c55e" : "#1e293b";
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:white;padding:5px 10px;border-radius:20px;font-size:12px;font-weight:800;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;transform:${isActive ? "scale(1.15)" : "scale(1)"};transition:all 0.2s;cursor:pointer">${formatted}</div><div style="width:8px;height:8px;background:${bg};margin:0 auto;clip-path:polygon(0 0,100% 0,50% 100%);margin-top:-1px"></div>`,
    iconSize: [70, 36], iconAnchor: [35, 36], popupAnchor: [0, -36],
  });
}

// Sin sesión no mostramos el pin exacto (evita usar el mapa de resultados
// como atajo para sacar la ubicación precisa que se bloquea en el detalle
// de la propiedad) — redondeamos a una cuadrícula de ~1km y dibujamos una
// zona en vez de un punto.
function approxZoneCenter(lat, lng) {
  const round = (n) => Math.round(n * 100) / 100;
  return [round(lat), round(lng)];
}

function PropertyPopupContent({ prop }) {
  return (
    <div className="text-sm min-w-[160px]">
      <PropertyImage src={prop.image} type={prop.type} alt={prop.title} className="w-full h-24 object-cover rounded-lg mb-2"/>
      <p className="font-bold text-gray-900 leading-snug">{prop.title}</p>
      <p className="text-blue-600 font-black mt-1"><PriceTag price={prop.price} currency={prop.currency} /></p>
      <p className="text-gray-500 text-xs mt-0.5">{prop.status} · {prop.type}</p>
      <Link
        to={`/property/${prop.id}`}
        className="block w-full mt-2 text-center py-2 rounded-lg text-xs font-bold text-white transition hover:opacity-90"
        style={{ backgroundColor: "#2563eb", boxShadow: "0 2px 6px rgba(37,99,235,0.4)" }}
      >
        Ver detalles →
      </Link>
    </div>
  );
}

function MapFocus({ properties, version }) {
  const map = useMap();
  useEffect(() => {
    if (properties.length === 1) {
      map.setView([properties[0].lat, properties[0].lng], 13, { animate: true });
    } else if (properties.length > 1) {
      const bounds = L.latLngBounds(properties.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [60, 60], animate: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);
  return null;
}

const TYPE_MAP   = { APARTAMENTO: "Apartamento", CASA: "Casa", VILLA: "Villa" };
const STATUS_MAP = { VENTA: "Venta", RENTA: "Renta", VENDIDO: "Vendido", RENTADO: "Rentado" };

const normalizeProperty = (p) => ({
  ...p,
  type:   TYPE_MAP[p.type]     || p.type,
  status: STATUS_MAP[p.status] || p.status,
  image:  p.images?.[0] || "",
});

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeId,   setActiveId]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [results,    setResults]    = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [mapVersion, setMapVersion] = useState(0);
  const [filters,    setFilters]    = useState({
    status:   searchParams.get("status")   || "",
    type:     searchParams.get("type")     || "",
    rooms:    searchParams.get("rooms")    || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
  });

  // Re-sincroniza los filtros si cambia la URL (ej. al abrir una búsqueda
  // guardada desde otra página mientras ya estás en /search)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setFilters({
      status:   searchParams.get("status")   || "",
      type:     searchParams.get("type")     || "",
      rooms:    searchParams.get("rooms")    || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
    });
  }, [searchParams]);

  const { toggleFavorite, isFavorite } = useProperties();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [savingSearch, setSavingSearch] = useState(false);
  const query      = searchParams.get("q") || "";
  const debounceRef = useRef(null);

  const handleSaveSearch = async () => {
    const name = window.prompt(
      "¿Cómo quieres llamar a esta búsqueda?",
      query ? `Búsqueda: ${query}` : "Mi búsqueda"
    );
    if (!name?.trim()) return;
    setSavingSearch(true);
    try {
      const res = await fetch(`${API_URL}/api/saved-searches`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...CSRF_HEADERS },
        body: JSON.stringify({ name: name.trim(), filters: { ...filters, search: query } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar la búsqueda.");
      toast({ message: "Búsqueda guardada ✅", type: "success" });
    } catch (err) {
      toast({ message: err.message, type: "error" });
    } finally {
      setSavingSearch(false);
    }
  };

  // ── FETCH AL BACKEND ───────────────────────────────────────────────────────
  // pageNum > 1 es "Cargar más": pide la página siguiente y la suma a la
  // lista que ya estaba, en vez de reemplazarla.
  const fetchResults = useCallback(async (q, f, pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q && q !== "república dominicana") params.set("search", q);
      if (f.status)   params.set("status",   f.status.toUpperCase());
      if (f.type)     params.set("type",     f.type.toUpperCase());
      if (f.rooms)    params.set("rooms",    f.rooms);
      if (f.minPrice) params.set("minPrice", f.minPrice);
      if (f.maxPrice) params.set("maxPrice", f.maxPrice);
      params.set("limit", 50);
      params.set("page", pageNum);

      const res  = await fetch(`${API_URL}/api/properties?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const normalized = data.properties.map(normalizeProperty);
      setResults((prev) => (pageNum === 1 ? normalized : [...prev, ...normalized]));
      setTotal(data.pagination?.total ?? normalized.length);
      setPage(pageNum);
      setMapVersion((v) => v + 1);
    } catch (err) {
      console.error("SearchResults fetch error:", err);
      if (pageNum === 1) setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce: espera 400ms después del último cambio antes de hacer fetch
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(query, filters, 1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, filters, fetchResults]);

  const resetFilters = () => setFilters({ status: "", type: "", rooms: "", minPrice: "", maxPrice: "" });
  const hasFilters = Object.values(filters).some(Boolean);

  const selectClass = "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-4 py-2 text-sm outline-none border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 transition-colors";

  // Título descriptivo por combinación de filtros ("Casas en renta") — pero
  // una búsqueda de texto libre (?q=) no es una página canónica (infinitas
  // variantes del mismo contenido), así que esas no se indexan.
  const searchTitle = [filters.type, filters.status && `en ${filters.status.toLowerCase()}`]
    .filter(Boolean)
    .join(" ") || "Resultados de búsqueda";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 flex flex-col">
      <Seo
        title={searchTitle}
        description={`${total > 0 ? `${total} propiedades encontradas` : "Buscá"} en Domify — apartamentos, casas y villas en venta o renta en República Dominicana.`}
        path="/search"
        noindex={Boolean(query)}
      />
      <Navbar />

      {/* BARRA BÚSQUEDA + FILTROS */}
      <div className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-wrap items-center gap-3 z-40 shadow-sm">
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 gap-2 flex-1 min-w-[200px] max-w-sm">
          <Search size={16} strokeWidth={2.25} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set("q", e.target.value);
              else next.delete("q");
              setSearchParams(next, { replace: true });
            }}
            placeholder="Buscar ciudad, sector..."
            className="bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 w-full"
          />
        </div>

        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className={selectClass}>
          <option value="" className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">Venta o Renta</option>
          <option value="Venta" className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">En Venta</option>
          <option value="Renta" className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">En Renta</option>
        </select>

        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className={selectClass}>
          <option value="" className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">Tipo</option>
          <option value="Apartamento" className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">Apartamento</option>
          <option value="Casa" className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">Casa</option>
          <option value="Villa" className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">Villa</option>
        </select>

        <select value={filters.rooms} onChange={(e) => setFilters({ ...filters, rooms: e.target.value })} className={selectClass}>
          <option value="" className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">Habitaciones</option>
          {[1,2,3,4,5].map((n) => (
            <option key={n} value={n} className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">{n}+ hab</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <input
            type="number" placeholder="Precio mín" value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className={`${selectClass} w-28`}
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="number" placeholder="Precio máx" value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className={`${selectClass} w-28`}
          />
        </div>

        {hasFilters && (
          <button onClick={resetFilters} className="text-xs text-red-500 hover:text-red-700 font-semibold whitespace-nowrap transition">
            ✕ Limpiar
          </button>
        )}

        {currentUser && (query || hasFilters) && (
          <button
            onClick={handleSaveSearch}
            disabled={savingSearch}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg whitespace-nowrap transition disabled:opacity-50"
          >
            💾 {savingSearch ? "Guardando..." : "Guardar búsqueda"}
          </button>
        )}

        <span className="text-gray-400 dark:text-gray-500 text-sm ml-auto hidden md:block">
          {loading ? "Buscando..." : (
            <>{total} resultado{total !== 1 ? "s" : ""} para <strong className="text-gray-700 dark:text-gray-200">"{query}"</strong></>
          )}
        </span>
      </div>

      {/* LAYOUT DOS COLUMNAS */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 118px)" }}>

        {/* CARDS */}
        <div className="w-full lg:w-[48%] overflow-y-auto px-4 py-5">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => <PropertyCardSkeleton key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-gray-500 dark:text-gray-400 font-semibold">
                No encontramos propiedades para "{query}"
              </p>
              <p className="text-gray-400 text-sm mt-1">Intenta con otro sector o provincia</p>
              <Link to="/" className="mt-4 text-blue-600 text-sm font-semibold hover:underline">← Volver al inicio</Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((prop, i) => (
                <motion.div key={prop.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link to={`/property/${prop.id}`}>
                    <div
                      onMouseEnter={() => setActiveId(prop.id)}
                      onMouseLeave={() => setActiveId(null)}
                      className={`group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden transition-all duration-200 border-2 cursor-pointer ${
                        activeId === prop.id
                          ? "border-blue-500 shadow-xl scale-[1.01]"
                          : "border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl"
                      }`}
                    >
                      <div className="relative overflow-hidden">
                        <PropertyImage src={prop.image} type={prop.type} alt={prop.title}
                          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"/>
                        <div className="absolute top-2 left-2 flex gap-1.5 items-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            prop.status === "Venta" ? "bg-blue-600 text-white" : "bg-green-500 text-white"
                          }`}>{prop.status}</span>
                          <span className="bg-white/90 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded-full text-xs font-semibold">
                            {prop.type}
                          </span>
                          {prop.verified && <VerifiedBadge />}
                        </div>
                        <button
                          onClick={(e) => { e.preventDefault(); toggleFavorite(prop.id); }}
                          className="absolute top-2 right-2 bg-white dark:bg-gray-800 w-7 h-7 rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
                        >
                          <Heart
                            size={13}
                            strokeWidth={2.25}
                            fill={isFavorite(prop.id) ? "currentColor" : "none"}
                            className={isFavorite(prop.id) ? "text-red-500" : "text-gray-400"}
                          />
                        </button>
                      </div>
                      <div className="p-3">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{prop.title}</h3>
                        <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
                          <MapPin size={12} strokeWidth={2.25} /> {formatLocation(prop.city, prop.sector, "Rep. Dominicana")}
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 font-black text-base mt-1">
                          <PriceTag price={prop.price} currency={prop.currency} />
                          {prop.status === "Renta" && <span className="text-xs font-normal text-gray-400">/mes</span>}
                        </p>
                        <div className="flex gap-3 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-400 text-xs">
                          <span className="flex items-center gap-1"><Bed size={13} strokeWidth={2.25} /> {prop.rooms}</span>
                          <span className="flex items-center gap-1"><Bath size={13} strokeWidth={2.25} /> {prop.baths}</span>
                          <span className="flex items-center gap-1"><Car size={13} strokeWidth={2.25} /> {prop.parking}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* CARGAR MÁS */}
          {!loading && results.length < total && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => fetchResults(query, filters, page + 1)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-8 py-3 rounded-2xl font-semibold shadow hover:shadow-md transition"
              >
                Cargar más · {total - results.length} restantes
              </button>
            </div>
          )}
        </div>

        {/* MAPA */}
        <div className="hidden lg:block flex-1 relative">
          <MapContainer center={[18.7357, -70.1627]} zoom={7} scrollWheelZoom className="w-full h-full" style={{ zIndex: 0 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
            <MapFocus properties={results} version={mapVersion}/>
            {currentUser ? (
              // Agrupados: con muchas propiedades visibles a la vez, montar
              // un Marker por cada una satura el DOM y el mapa se congela
              // (ver prueba de carga — 1 fps con 10k pines sin agrupar,
              // 61 fps agrupados). leaflet.markercluster resuelve esto
              // fusionando los pines cercanos en un solo círculo con contador
              // hasta que el usuario hace zoom lo suficiente.
              <MarkerClusterGroup
                chunkedLoading
                maxClusterRadius={60}
                disableClusteringAtZoom={16}
                spiderfyOnMaxZoom
                iconCreateFunction={clusterIcon}
              >
                {results.map((prop) => (
                  <Marker key={prop.id} position={[prop.lat, prop.lng]}
                    icon={createPriceIcon(prop.price, activeId === prop.id, prop.status, prop.currency)}
                    eventHandlers={{ mouseover: () => setActiveId(prop.id), mouseout: () => setActiveId(null) }}
                  >
                    <Popup>
                      <PropertyPopupContent prop={prop} />
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            ) : (
              // Zonas aproximadas: son Circle, no Marker, así que el plugin
              // de clustering no las agrupa — se quedan sueltas como antes.
              results.map((prop) => (
                <Circle key={prop.id} center={approxZoneCenter(prop.lat, prop.lng)} radius={900}
                  pathOptions={{ color: "#1a56db", weight: 1, fillColor: "#1a56db", fillOpacity: 0.15 }}
                  eventHandlers={{ mouseover: () => setActiveId(prop.id), mouseout: () => setActiveId(null) }}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent>
                    <span className="font-bold">
                      {formatPriceShort(prop.price, prop.currency)}
                    </span>
                  </Tooltip>
                  <Popup>
                    <PropertyPopupContent prop={prop} />
                    <p className="text-[11px] text-gray-400 mt-2">
                      Zona aproximada — inicia sesión para ver la ubicación exacta.
                    </p>
                  </Popup>
                </Circle>
              ))
            )}
          </MapContainer>
        </div>

      </div>
      <Footer />
    </div>
  );
}