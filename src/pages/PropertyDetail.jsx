import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { Bed, Bath, Car, MapPin, Heart, ChevronLeft, ChevronRight, X, Share2, Check, MessageCircle, CalendarPlus, PlayCircle, Box, Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Seo, { SITE_URL } from "../components/Seo";
import AuthModal from "../components/AuthModal";
import VerifiedBadge from "../components/VerifiedBadge";
import PropertyCard from "../components/PropertyCard";
import { useProperties } from "../context/PropertiesContext";
import { useAuth, CSRF_HEADERS } from "../context/AuthContext";
import { useInbox } from "../context/InboxContext";
import ReviewSection from "../components/ReviewSection";
import { useToast } from "../context/ToastContext";
import { formatPrice } from "../utils/formatPrice";
import PriceTag, { PriceEquivalent } from "../components/PriceTag";
import { useFxRate } from "../hooks/useFxRate";
import { formatLocation } from "../utils/formatLocation";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const extraImages = {
  Apartamento: [
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
    "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800",
  ],
  Casa: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
  ],
  Villa: [
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800",
  ],
};

const amenityIcons = {
  "Piscina": "🏊", "Gym": "💪", "Lobby": "🏛️", "Seguridad 24/7": "🔒",
  "Patio": "🌿", "Terraza": "🌇", "Portón eléctrico": "🚪", "Parqueo doble": "🚗",
  "Vista al mar": "🌊", "BBQ": "🔥", "Seguridad": "🛡️", "Jacuzzi": "🛁",
  "Chimenea": "🔆", "Jardín": "🌳", "Área BBQ": "🥩", "Rooftop": "🏙️",
  "Muelle privado": "⛵", "Área infantil": "🎠", "Balcón": "🌅",
  "Ascensor": "🛗", "Cocina moderna": "🍳", "Parqueo": "🅿️",
};

const TYPE_MAP   = { APARTAMENTO: "Apartamento", CASA: "Casa", VILLA: "Villa" };
const STATUS_MAP = { VENTA: "Venta", RENTA: "Renta", VENDIDO: "Vendido", RENTADO: "Rentado" };
const normalizeProperty = (p) => ({
  ...p,
  type:   TYPE_MAP[p.type]     || p.type,
  status: STATUS_MAP[p.status] || p.status,
  image:  p.images?.[0] || "",
});

export default function PropertyDetail() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const { id } = useParams();
  const { allProperties, toggleFavorite, isFavorite } = useProperties();
  const { currentUser } = useAuth();
  const { sendMessage } = useInbox();
  const { toast } = useToast();

  const cachedProperty = useMemo(
    () => allProperties.find((p) => p.id === id || p.id === Number(id)),
    [allProperties, id]
  );

  const [directProperty, setDirectProperty] = useState(null);
  const [loadingDirect, setLoadingDirect]   = useState(false);

  useEffect(() => {
    if (cachedProperty || !id) return;
    let cancelled = false;
    (async () => {
      setLoadingDirect(true);
      try {
        const res  = await fetch(`${API_URL}/api/properties/${id}`, { credentials: "include" });
        const data = await res.json();
        if (!cancelled && res.ok && data) {
          setDirectProperty(normalizeProperty(data));
        }
      } catch {
        // La propiedad no existe o fue eliminada — se muestra el estado de "no encontrada"
      } finally {
        if (!cancelled) setLoadingDirect(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, cachedProperty]);

  const property = cachedProperty || directProperty;

  // El backend devuelve publishedBy como objeto { id, name, avatar } — el
  // email no se expone públicamente por privacidad.
  // Los datos mock lo tienen como string. Normalizamos aquí.
  const publishedByName = property
    ? (typeof property.publishedBy === "object" && property.publishedBy !== null
        ? property.publishedBy.name
        : property.publishedBy || "Domify")
    : "Domify";

  const publishedById = property
    ? (typeof property.publishedBy === "object" && property.publishedBy !== null
        ? property.publishedBy.id
        : property.publishedById || "admin")
    : "admin";

  const publishedByAvatar = property && typeof property.publishedBy === "object" && property.publishedBy !== null
    ? property.publishedBy.avatar
    : null;

  // Sello "agente verificado" del publicador — el backend lo expone en el
  // publishedBy de la propiedad desde que un admin verificó la cuenta.
  const publishedByVerified = property && typeof property.publishedBy === "object" && property.publishedBy !== null
    ? Boolean(property.publishedBy.verified)
    : false;

  // ¿Soy el dueño? Un dueño no se agenda visitas a sí mismo (el backend lo
  // rechaza con 403) — mejor ocultar el botón directamente.
  const isOwner = Boolean(currentUser && publishedById === currentUser.id);

  const similar = property
    ? allProperties
        .filter((p) => p.id !== property.id && (p.type === property.type || p.city === property.city))
        .slice(0, 4)
    : [];

  const [lightbox, setLightbox] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const galleryRef = useRef(null);

  // ── AGENDAR VISITA ────────────────────────────────────────────────────────
  const [visitOpen, setVisitOpen] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitMsg, setVisitMsg] = useState("");
  const [visitBusy, setVisitBusy] = useState(false);
  const [visitDone, setVisitDone] = useState(false);

  const openVisit = () => {
    // Sin sesión, el flujo pide login antes de abrir el modal.
    if (!currentUser) { setAuthOpen(true); return; }
    setVisitDone(false);
    setVisitOpen(true);
  };

  const submitVisit = async () => {
    if (!visitDate || !currentUser) return;
    setVisitBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/visits`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...CSRF_HEADERS },
        body: JSON.stringify({ propertyId: property.id, scheduledAt: new Date(visitDate).toISOString(), message: visitMsg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo agendar la visita.");
      setVisitDone(true);
      setVisitMsg("");
      setVisitDate("");
      toast({ message: "Visita agendada — el vendedor la confirmará 📅", type: "success" });
      setTimeout(() => setVisitOpen(false), 1600);
    } catch (err) {
      toast({ message: err.message, type: "error" });
    } finally {
      setVisitBusy(false);
    }
  };

  const fxRate = useFxRate();

  useEffect(() => {
    const onScroll = () => {
      const bottom = galleryRef.current?.getBoundingClientRect().bottom ?? 0;
      setShowStickyBar(bottom < 64);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({ message: "Link copiado al portapapeles 🔗", type: "info" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const msg = `🏠 *${property.title}*\n💰 ${formatPrice(property.price, property.currency)}\n📍 ${formatLocation(property.city, property.sector)}\n\n🔗 ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleSendMessage = () => {
    if (!msgText.trim() || !currentUser) return;
    sendMessage({
      fromId: currentUser.id,
      fromName: currentUser.name,
      toId: publishedById,
      toName: publishedByName,
      propertyId: property.id,
      propertyTitle: property.title,
      text: msgText,
    });
    setMsgText("");
    setMsgSent(true);
    toast({ message: "Mensaje enviado al vendedor ✉️", type: "success" });
    setTimeout(() => setMsgSent(false), 3000);
  };

  if (loadingDirect && !property) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center text-center px-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Cargando propiedad...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center text-center px-4">
        <p className="text-6xl mb-4">🏚️</p>
        <p className="text-2xl font-black text-gray-900 dark:text-white mb-2">Propiedad no encontrada</p>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Esta propiedad no existe o fue eliminada.</p>
        <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition">
          🏠 Volver al inicio
        </Link>
      </div>
    );
  }

  const gallery = property.images?.length > 0
    ? property.images
    : [property.image, ...(extraImages[property.type] || [])];

  // Google no tiene un rich result dedicado para listados inmobiliarios,
  // pero RealEstateListing es el markup que schema.org y el resto del
  // ecosistema (portales, agregadores) esperan — ayuda a que el buscador
  // entienda el contenido de la página aunque no haya snippet especial.
  const propertyJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
    url: `${SITE_URL}/property/${property.id}`,
    image: gallery.length ? gallery : undefined,
    datePosted: property.createdAt,
    dateModified: property.updatedAt,
    about: {
      "@type": { Apartamento: "Apartment", Casa: "House", Villa: "House" }[property.type] || "Residence",
      name: property.title,
      numberOfRooms: property.rooms || undefined,
      numberOfBathroomsTotal: property.baths || undefined,
      address: {
        "@type": "PostalAddress",
        addressLocality: property.sector || property.city,
        addressRegion: property.city,
        addressCountry: "DO",
      },
    },
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: property.currency || "USD",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pb-16 lg:pb-0">
      <Seo
        title={`${property.title} — ${formatPrice(property.price, property.currency)}`}
        description={
          property.description?.length > 160
            ? `${property.description.slice(0, 157)}...`
            : property.description || `${property.title} en ${formatLocation(property.city, property.sector)}. Publicado en Domify.`
        }
        path={`/property/${property.id}`}
        image={gallery[0]}
        type="article"
        jsonLd={propertyJsonLd}
      />
      <Navbar />

      {/* ── BARRA FLOTANTE — precio + WhatsApp, aparece al pasar la galería ──
           Mobile: pegada abajo. Desktop (lg+): pegada arriba, bajo el navbar. */}
      <div
        className={`fixed bottom-0 lg:bottom-auto lg:top-16 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t lg:border-t-0 lg:border-b border-gray-100 dark:border-gray-700 shadow-lg px-4 md:px-6 py-3 flex items-center gap-3 transition-transform duration-300 ${
          showStickyBar
            ? "translate-y-0"
            : "translate-y-[130%] lg:-translate-y-[130%]"
        }`}
      >
        <p className="font-black text-gray-900 dark:text-white text-lg whitespace-nowrap">
          <PriceTag price={property.price} currency={property.currency} />
          <span className="block text-xs text-gray-400 font-semibold"><PriceEquivalent price={property.price} currency={property.currency} rate={fxRate} /></span>
        </p>
        <p className="hidden sm:block text-sm text-gray-400 truncate flex-1">{property.title}</p>
        <button
          onClick={handleWhatsApp}
          className="ml-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold transition shadow-md flex items-center gap-1.5 whitespace-nowrap"
        >
          <MessageCircle size={15} strokeWidth={2.25} /> WhatsApp
        </button>
      </div>

      {/* ── GALERÍA HERO ── */}
      <div ref={galleryRef} className="relative h-[55vh] min-h-[400px] max-h-[640px]">

        {/* IMAGEN PRINCIPAL con blur de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          <img src={gallery[0]} alt="bg" className="w-full h-full object-cover scale-110 blur-sm opacity-30 dark:opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-100/60 via-transparent to-gray-100 dark:from-gray-950/60 dark:to-gray-950" />
        </div>

        {/* CARRUSEL MOBILE */}
        <div className="relative h-full md:hidden">
          <img
            src={gallery[currentSlide]}
            alt={`slide-${currentSlide}`}
            className="w-full h-full object-cover"
          />
          {/* flechas */}
          <button
            onClick={() => setCurrentSlide((currentSlide - 1 + gallery.length) % gallery.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-9 h-9 rounded-full flex items-center justify-center transition backdrop-blur-sm"
          ><ChevronLeft size={20} strokeWidth={2.5} /></button>
          <button
            onClick={() => setCurrentSlide((currentSlide + 1) % gallery.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-9 h-9 rounded-full flex items-center justify-center transition backdrop-blur-sm"
          ><ChevronRight size={20} strokeWidth={2.5} /></button>
          {/* dots */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            {gallery.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all ${i === currentSlide ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50"}`}
              />
            ))}
          </div>
          {/* contador */}
          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">
            {currentSlide + 1} / {gallery.length}
          </div>
          {/* abrir lightbox */}
          <button
            onClick={() => setLightbox(currentSlide)}
            className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium border border-white/20"
          >
            🔍 Ver todas
          </button>
        </div>

        {/* GRID DESKTOP */}
        <div className="relative h-full max-w-6xl mx-auto px-4 md:px-6 py-4 hidden md:grid grid-cols-4 grid-rows-2 gap-2">
          {/* Foto principal */}
          <div
            className="col-span-2 row-span-2 rounded-3xl overflow-hidden cursor-pointer relative group shadow-2xl"
            onClick={() => setLightbox(0)}
          >
            <img src={gallery[0]} alt="main" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
          </div>
          {/* 4 miniaturas */}
          {gallery.slice(1, 5).map((img, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden cursor-pointer relative group shadow-lg"
              onClick={() => setLightbox(i + 1)}
            >
              <img src={img} alt={`p${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition" />
              {i === 3 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                  <span className="text-white font-bold text-xs bg-white/20 px-3 py-1.5 rounded-full border border-white/30">
                    📷 Ver todas
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* BOTONES FLOTANTES */}
        <div className="absolute top-6 right-6 z-10 flex gap-2">
          <button
            onClick={handleShare}
            className="bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:bg-white dark:hover:bg-gray-800 transition flex items-center gap-1.5"
          >
            {copied ? <><Check size={15} strokeWidth={2.5} className="text-green-500" /> Copiado</> : <><Share2 size={15} strokeWidth={2.25} /> Compartir</>}
          </button>
          <button
            onClick={() => {
              toggleFavorite(property.id);
              toast({
                message: isFavorite(property.id) ? "Eliminado de favoritos" : "Guardado en favoritos ❤️",
                type: isFavorite(property.id) ? "info" : "success",
              });
            }}
            className="bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <Heart
              size={17}
              strokeWidth={2.25}
              fill={isFavorite(property.id) ? "currentColor" : "none"}
              className={isFavorite(property.id) ? "text-red-500" : "text-gray-500 dark:text-gray-300"}
            />
          </button>
        </div>

      </div>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-5 right-5 text-white/60 hover:text-white transition" onClick={() => setLightbox(null)}><X size={30} strokeWidth={2} /></button>
            <button
              className="absolute left-4 text-white/60 hover:text-white px-4 py-2 transition"
              onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + gallery.length) % gallery.length); }}
            ><ChevronLeft size={44} strokeWidth={1.75} /></button>
            <motion.img
              key={lightbox}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={gallery[lightbox]}
              alt="lightbox"
              className="max-h-[88vh] max-w-[88vw] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute right-4 text-white/60 hover:text-white px-4 py-2 transition"
              onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % gallery.length); }}
            ><ChevronRight size={44} strokeWidth={1.75} /></button>
            <p className="absolute bottom-5 text-white/40 text-sm">{lightbox + 1} / {gallery.length}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTENIDO ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="max-w-6xl mx-auto px-4 md:px-6 py-8"
      >
        {/* ── FRANJA DE TÍTULO — vive sobre el fondo, sin card ── */}
        <div className="mb-7">
          <div className="flex gap-2 mb-3 flex-wrap items-center">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              property.status === "Venta" ? "bg-blue-600 text-white" : "bg-green-500 text-white"
            }`}>{property.status}</span>
            <span className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1 rounded-full text-xs font-bold">
              {property.type}
            </span>
            {property.verified && <VerifiedBadge size="lg" />}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight">
            {property.title}
          </h1>
          <p className="text-gray-400 mt-2 flex items-center gap-1.5 text-sm">
            <MapPin size={14} strokeWidth={2.25} /> {formatLocation(property.city, property.sector)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── COLUMNA IZQUIERDA — hoja continua ── */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 transition-colors overflow-hidden">

              {/* PRECIO — protagonista, abre la hoja */}
              <div className="p-6">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">
                  {property.status === "Venta" ? "Precio de venta" : "Renta mensual"}
                </p>
                <p className="text-5xl md:text-6xl font-black text-blue-600 dark:text-blue-400 leading-none tracking-tight">
                  <PriceTag price={property.price} currency={property.currency} />
                  {property.status === "Renta" && <span className="text-lg font-normal text-gray-400 ml-2">/mes</span>}
                </p>
                <p className="mt-2"><PriceEquivalent price={property.price} currency={property.currency} rate={fxRate} /></p>
                <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
                  {[
                    { Icon: Bed, value: property.rooms, label: "habitaciones" },
                    { Icon: Bath, value: property.baths, label: "baños" },
                    { Icon: Car, value: property.parking, label: "parqueos" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <s.Icon size={18} strokeWidth={2.25} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 dark:text-white text-lg leading-none">{s.value}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DESCRIPCIÓN */}
              <div className="p-6">
                <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-600 rounded-full" />
                  Descripción
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-8 text-sm">{property.description}</p>
              </div>

              {/* AMENIDADES — preview + expandir */}
              {property.amenities?.length > 0 && (
                <div className="p-6">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-blue-600 rounded-full" />
                    Amenidades
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {(amenitiesExpanded ? property.amenities : property.amenities.slice(0, 6)).map((item, i) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl px-4 py-3 transition-colors group"
                      >
                        <span className="text-xl group-hover:scale-110 transition-transform">{amenityIcons[item] || "✅"}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                  {property.amenities.length > 6 && (
                    <button
                      onClick={() => setAmenitiesExpanded((v) => !v)}
                      className="mt-4 border border-gray-200 dark:border-gray-600 text-blue-600 dark:text-blue-400 font-bold text-sm px-4 py-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                    >
                      {amenitiesExpanded ? "Ver menos ↑" : `Ver las ${property.amenities.length} amenidades ↓`}
                    </button>
                  )}
                </div>
              )}

              {/* VIDEO / TOUR VIRTUAL — enlaces que pegó el vendedor al
                   publicar. El video va embebido (YouTube/Vimeo suelen
                   permitir iframe); el tour 360° (Matterport/3DVista) abre en
                   pestaña nueva porque muchos embebibles exigen sus propios
                   scripts que no queremos cargar en la página. */}
              {(property.videoUrl || property.virtualTourUrl) && (
                <div className="p-6">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-blue-600 rounded-full" />
                    Video y tour virtual
                  </h2>
                  <div className="space-y-3">
                    {property.videoUrl && (
                      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700">
                        <div className="aspect-video">
                          <iframe
                            src={property.videoUrl}
                            title="Video de la propiedad"
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                    {property.virtualTourUrl && (
                      <a
                        href={property.virtualTourUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-3 transition-colors"
                      >
                        <Box size={20} strokeWidth={2} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">Recorrido virtual 360°</p>
                          <p className="text-xs text-gray-400">Explora la propiedad en otra pestaña</p>
                        </div>
                        <span className="ml-auto text-blue-600 dark:text-blue-400 font-bold text-sm">Abrir →</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* MAPA */}
              <div className="p-6">
                <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-600 rounded-full" />
                  Ubicación
                </h2>
                <p className="text-sm text-gray-400 mb-3 flex items-center gap-1">
                  <MapPin size={13} strokeWidth={2.25} /> {formatLocation(property.city, property.sector)}
                </p>

                {property.lat != null && property.lng != null ? (
                  currentUser ? (
                    <MapContainer center={[property.lat, property.lng]} zoom={14} className="h-[280px] rounded-2xl">
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[property.lat, property.lng]}>
                        <Popup>{property.title}</Popup>
                      </Marker>
                    </MapContainer>
                  ) : (
                  <div className="relative h-[280px] rounded-2xl overflow-hidden">
                    {/* Mapa real de fondo, desenfocado y sin interacción — el
                        scale-110 evita que se note el borde sin difuminar
                        que deja el filtro blur en los bordes del contenedor. */}
                    <div className="absolute inset-0 scale-110">
                      <MapContainer
                        center={[property.lat, property.lng]}
                        zoom={13}
                        zoomControl={false}
                        dragging={false}
                        scrollWheelZoom={false}
                        doubleClickZoom={false}
                        touchZoom={false}
                        boxZoom={false}
                        keyboard={false}
                        attributionControl={false}
                        className="h-full w-full blur-md pointer-events-none"
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      </MapContainer>
                    </div>
                    <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center text-center px-6">
                      <div>
                        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mx-auto mb-3">
                          <MapPin size={22} strokeWidth={2.25} className="text-white" />
                        </div>
                        <p className="font-bold text-white">Zona aproximada</p>
                        <p className="text-sm text-white/70 mt-1 max-w-xs mx-auto">
                          Inicia sesión para ver la ubicación exacta de esta propiedad.
                        </p>
                        <button
                          onClick={() => setAuthOpen(true)}
                          className="mt-4 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition hover:opacity-90"
                          style={{ background: "linear-gradient(135deg, #1a56db, #0ea5e9)" }}
                        >
                          Iniciar sesión →
                        </button>
                      </div>
                    </div>
                  </div>
                  )
                ) : (
                  <div className="relative h-[280px] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-center px-6">
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                        <MapPin size={22} strokeWidth={2.25} className="text-gray-400" />
                      </div>
                      <p className="font-bold text-gray-700 dark:text-gray-300">Ubicación no disponible</p>
                      <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
                        Inicia sesión para ver la ubicación de esta propiedad.
                      </p>
                      {!currentUser && (
                        <button
                          onClick={() => setAuthOpen(true)}
                          className="mt-4 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition hover:opacity-90"
                          style={{ background: "linear-gradient(135deg, #1a56db, #0ea5e9)" }}
                        >
                          Iniciar sesión →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── SIDEBAR — panel flotante, se monta sobre la hoja ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4 lg:-mt-8">

              {/* CARD CONTACTO */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">

                {/* HEADER SIDEBAR */}
                <div className="p-5 text-white" style={{ background: "linear-gradient(135deg, #1a56db, #0ea5e9)" }}>
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">
                    {property.status === "Venta" ? "Precio de venta" : "Renta mensual"}
                  </p>
                  <p className="text-3xl font-black">
                    <PriceTag price={property.price} currency={property.currency} />
                    {property.status === "Renta" && <span className="text-sm font-normal opacity-70 ml-1">/mes</span>}
                  </p>
                  <p className="text-xs font-semibold opacity-70 mt-0.5">
                    <PriceEquivalent price={property.price} currency={property.currency} rate={fxRate} />
                  </p>
                </div>

                <div className="p-5 space-y-4">

                  {/* AGENTE */}
                  {publishedByName && (
                    <Link
                      to={`/agent/${publishedById}`}
                      className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-2xl p-3 transition-colors"
                    >
                      {publishedByAvatar ? (
                        <img src={publishedByAvatar} alt={publishedByName} className="w-10 h-10 rounded-xl object-cover shadow-md shrink-0" />
                      ) : (
                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-md shrink-0">
                          {publishedByName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400">Publicado por</p>
                        <p className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                          {publishedByName}
                          {publishedByVerified && (
                            <span title="Agente verificado por Domify" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full">
                              ✓ Verificado
                            </span>
                          )}
                        </p>
                      </div>
                    </Link>
                  )}

                  {/* MENSAJE */}
                  {currentUser ? (
                    msgSent ? (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 rounded-2xl px-4 py-3 text-sm font-semibold text-center"
                      >
                        ✅ Mensaje enviado
                      </motion.div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={msgText}
                          onChange={(e) => setMsgText(e.target.value)}
                          placeholder="Hola, estoy interesado en esta propiedad..."
                          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none h-24 transition-colors"
                        />
                        <motion.button
                          whileHover={{ scale: msgText.trim() ? 1.02 : 1 }}
                          whileTap={{ scale: msgText.trim() ? 0.98 : 1 }}
                          onClick={handleSendMessage}
                          disabled={!msgText.trim()}
                          className="w-full text-white py-3 rounded-2xl font-bold transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: "linear-gradient(135deg, #1a56db, #0ea5e9)" }}
                        >
                          ✉️ Enviar mensaje
                        </motion.button>
                      </div>
                    )
                  ) : (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                      <button onClick={() => setAuthOpen(true)} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Inicia sesión</button> para contactar al vendedor
                    </div>
                  )}

                  {/* AGENDAR VISITA — solo si no soy el dueño de la propiedad */}
                  {!isOwner && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={openVisit}
                      className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-2xl font-bold transition shadow-md"
                      style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
                    >
                      <CalendarPlus size={17} strokeWidth={2.25} /> Agendar una visita
                    </motion.button>
                  )}

                  {/* BOTONES — WhatsApp (principal) + Compartir (icon-only) en una sola fila */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleWhatsApp}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-2xl font-bold transition shadow-md flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={17} strokeWidth={2.25} /> WhatsApp
                    </button>
                    <button
                      onClick={handleShare}
                      title="Compartir"
                      className="w-12 shrink-0 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-2xl transition flex items-center justify-center"
                    >
                      {copied ? <Check size={18} strokeWidth={2.5} className="text-green-500" /> : <Share2 size={17} strokeWidth={2.25} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* NOTA */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 flex gap-3">
                <span className="text-lg shrink-0">🔒</span>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-5 font-medium">
                  Domify no cobra comisión por contactar. Verifica siempre la identidad del vendedor.
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* ── PROPIEDADES SIMILARES ── */}
        {similar.length > 0 && (
          <div className="mt-4">
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full" />
              Propiedades similares
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {similar.map((prop, i) => (
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
          </div>
        )}

      </motion.div>
      {property && (
        <div className="max-w-5xl mx-auto px-4 pb-16">
          <ReviewSection propertyId={property.id} publishedById={publishedById} />
        </div>
      )}
      <Footer />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ── MODAL AGENDAR VISITA ── */}
      <AnimatePresence>
        {visitOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.5)" }}
            onClick={(e) => e.target === e.currentTarget && setVisitOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <CalendarPlus size={18} strokeWidth={2.25} className="text-green-600 dark:text-green-400" />
                  Agendar visita
                </h3>
                <button onClick={() => setVisitOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition text-xl">×</button>
              </div>

              <div className="p-6 space-y-4">
                {visitDone ? (
                  <div className="text-center py-6">
                    <p className="text-4xl mb-3">✅</p>
                    <p className="font-bold text-gray-900 dark:text-white">Visita agendada</p>
                    <p className="text-sm text-gray-400 mt-1">El vendedor la revisará y te confirmará.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Elige fecha y hora para visitar <span className="font-bold text-gray-900 dark:text-white">"{property.title}"</span>.
                    </p>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Fecha y hora</label>
                      <input
                        type="datetime-local"
                        value={visitDate}
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Mensaje (opcional)</label>
                      <textarea
                        value={visitMsg}
                        onChange={(e) => setVisitMsg(e.target.value)}
                        placeholder="Ej. ¿Podría ser por la tarde? ¿La propiedad sigue disponible?"
                        rows={3}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none transition"
                      />
                    </div>
                    <button
                      onClick={submitVisit}
                      disabled={!visitDate || visitBusy}
                      className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-2xl font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
                    >
                      {visitBusy ? <Loader2 size={17} strokeWidth={2.5} className="animate-spin" /> : <CalendarPlus size={17} strokeWidth={2.25} />}
                      {visitBusy ? "Agendando..." : "Confirmar visita"}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}