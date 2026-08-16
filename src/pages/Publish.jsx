import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import Footer from "../components/Footer";
import CityAutocomplete from "../components/CityAutocomplete";
import { useProperties } from "../context/PropertiesContext";
import { useAuth, CSRF_HEADERS } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

function LocationSelector({ setPosition }) {
  useMapEvents({ click(e) { setPosition(e.latlng); } });
  return null;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
    </div>
  );
}

const input = "w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all";

export default function Publish() {
  const { addProperty, published } = useProperties();
  const { currentUser } = useAuth();
  const { toast, banner } = useToast();
  const navigate = useNavigate();

  const myPublished = published.filter((p) => {
    const ownerId = typeof p.publishedBy === "object" && p.publishedBy !== null
      ? p.publishedBy.id : p.publishedById;
    return ownerId === currentUser?.id;
  });
  // Mismo tope que el backend (property.controller.js): Vendedor 3, Agente 10.
  // El frontend solo deshabilita el botón — la validación real está en el API.
  const roleLimit     = { Vendedor: 3, Agente: 10 }[currentUser?.role];
  const hasReachedLimit = roleLimit !== undefined && myPublished.length >= roleLimit;

  const [position,   setPosition]   = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState({});
  const [form, setForm] = useState({
    title: "", price: "", currency: "USD", description: "",
    type: "Apartamento", status: "Venta",
    rooms: 1, baths: 1, parking: 0,
    city: "", sector: "", images: [],
    videoUrl: "", virtualTourUrl: "",
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  // ── UPLOAD ────────────────────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 6 - form.images.length);
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("images", f));
      const res  = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        credentials: "include",
        headers: CSRF_HEADERS,
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir");
      setForm((p) => ({ ...p, images: [...p.images, ...data.urls] }));
    } catch (err) {
      toast({ message: err.message, type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (i) => setForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }));
  const moveImage   = (from, to) => {
    const imgs = [...form.images];
    const [m]  = imgs.splice(from, 1);
    imgs.splice(to, 0, m);
    setForm((p) => ({ ...p, images: imgs }));
  };

  // ── SUBMIT ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!position)              errs.position    = "Selecciona una ubicación en el mapa";
    if (!form.title.trim())     errs.title       = "Requerido";
    if (!form.city.trim())      errs.city        = "Requerida";
    if (!form.price)            errs.price       = "Requerido";
    if (!form.description.trim()) errs.description = "Requerida";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (hasReachedLimit) return;

    setSubmitting(true);
    try {
      await addProperty({
        ...form,
        lat: position.lat, lng: position.lng,
        publishedById: currentUser?.id,
        publishedBy:   currentUser?.name || "Anónimo",
      });
      banner({
        message:  "🏠 ¡Propiedad publicada!",
        subtitle: `"${form.title}" ya está visible en el feed`,
        type: "success", duration: 5000,
      });
      navigate("/profile");
    } catch (err) {
      toast({ message: err.message || "Error al publicar", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <Seo title="Publicar propiedad" noindex />
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">

        {/* Título */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Publicar propiedad
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Completa la información para publicar tu propiedad en Domify
          </p>
        </div>

        {/* Límite vendedor */}
        {hasReachedLimit && (
          <div className="mb-8 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-2xl px-5 py-4">
            <p className="text-red-600 dark:text-red-400 font-semibold text-sm">
              Límite alcanzado — {myPublished.length}/{roleLimit} propiedades publicadas
            </p>
            <p className="text-red-400 text-xs mt-1">
              Elimina una propiedad desde tu perfil para poder publicar una nueva.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">

          {/* ── SECCIÓN 1: UBICACIÓN ── */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-7 h-7 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black flex items-center justify-center flex-shrink-0">1</span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ubicación</h2>
            </div>

            {/* Mapa */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height: 380 }}>
              <MapContainer
                center={[18.7357, -70.1627]}
                zoom={8}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationSelector setPosition={setPosition} />
                {position && (
                  <Marker position={position}>
                    <Popup>📍 Tu propiedad</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>

            <div className="flex items-center justify-between mt-3">
              <p className={`text-sm ${position ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400"}`}>
                {position
                  ? `✓ Ubicación marcada — ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`
                  : "Haz clic en el mapa para marcar la ubicación · Scroll para hacer zoom"}
              </p>
              {position && (
                <button type="button" onClick={() => setPosition(null)}
                  className="text-xs text-gray-400 hover:text-red-500 transition font-medium">
                  Cambiar
                </button>
              )}
            </div>
            {errors.position && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.position}</p>
            )}
          </section>

          <div className="border-t border-gray-100 dark:border-gray-800"/>

          {/* ── SECCIÓN 2: INFORMACIÓN ── */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-7 h-7 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black flex items-center justify-center flex-shrink-0">2</span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Información</h2>
            </div>

            <div className="space-y-5">
              <Field label="Título" error={errors.title}>
                <input
                  placeholder="Ej. Apartamento moderno en Piantini"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  className={`${input} ${errors.title ? "ring-2 ring-red-400 border-red-300" : ""}`}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Ciudad" error={errors.city}>
                  <CityAutocomplete
                    value={form.city}
                    onChange={(city) => set("city", city)}
                    error={errors.city}
                    className={input}
                    placeholder="Santo Domingo Este"
                  />
                </Field>
                <Field label="Sector / Barrio (opcional)">
                  <input
                    placeholder="Sabana Larga"
                    value={form.sector}
                    onChange={(e) => set("sector", e.target.value)}
                    className={input}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Precio" error={errors.price}>
                  <div className="flex gap-2">
                    {/* Cada control va en su propio contenedor con el ancho
                        real (w-28 / flex-1) — la clase "input" ya trae
                        w-full adentro, así que mezclarla con otro ancho en
                        el mismo elemento hacía que compitieran entre sí. */}
                    <div className="w-28 flex-shrink-0">
                      <select
                        value={form.currency}
                        onChange={(e) => set("currency", e.target.value)}
                        className={`${input} px-2`}
                      >
                        <option value="USD" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">USD (US$)</option>
                        <option value="DOP" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">RD$ (DOP)</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="number" placeholder="150,000"
                        value={form.price}
                        onChange={(e) => set("price", e.target.value)}
                        className={`${input} ${errors.price ? "ring-2 ring-red-400 border-red-300" : ""}`}
                      />
                    </div>
                  </div>
                </Field>
                <Field label="Operación">
                  <select value={form.status} onChange={(e) => set("status", e.target.value)} className={input}>
                    <option className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Venta</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Renta</option>
                  </select>
                </Field>
              </div>

              <div>
                <Field label="Tipo de propiedad">
                  <select value={form.type} onChange={(e) => set("type", e.target.value)} className={input}>
                    <option className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Apartamento</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Casa</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Villa</option>
                  </select>
                </Field>
              </div>

              {/* Video / tour virtual (opcional) — URLs de YouTube, Vimeo,
                  Matterport, 3DVista... El backend valida que sean http(s). */}
              <Field label="Video de la propiedad (opcional)">
                <input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={form.videoUrl}
                  onChange={(e) => set("videoUrl", e.target.value)}
                  className={input}
                />
                <p className="text-xs text-gray-400 mt-1.5">Enlace de YouTube o Vimeo — se mostrará embebido en el detalle.</p>
              </Field>

              <Field label="Tour virtual 360° (opcional)">
                <input
                  placeholder="https://my.matterport.com/show/?m=..."
                  value={form.virtualTourUrl}
                  onChange={(e) => set("virtualTourUrl", e.target.value)}
                  className={input}
                />
                <p className="text-xs text-gray-400 mt-1.5">Recorrido 360° de Matterport, 3DVista u otra plataforma.</p>
              </Field>

              {/* Características */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Características</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      key: "rooms", label: "Habitaciones", opts: [1,2,3,4,5],
                      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 mx-auto text-gray-500 dark:text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12V7a2 2 0 012-2h14a2 2 0 012 2v5M3 12h18M3 12v5a2 2 0 002 2h14a2 2 0 002-2v-5M7 12V9a1 1 0 011-1h8a1 1 0 011 1v3"/></svg>
                    },
                    {
                      key: "baths", label: "Baños", opts: [1,2,3,4],
                      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 mx-auto text-gray-500 dark:text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 12a2 2 0 01-2-2V7a2 2 0 012-2h1m15 7a2 2 0 002-2V7a2 2 0 00-2-2h-1M4 12v5a2 2 0 002 2h12a2 2 0 002-2v-5M5 7V5a2 2 0 012-2h1"/></svg>
                    },
                    {
                      key: "parking", label: "Parqueos", opts: [0,1,2,3],
                      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 mx-auto text-gray-500 dark:text-gray-400"><rect x="2" y="7" width="20" height="13" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M9 12h2.5a1.5 1.5 0 010 3H9v-3zm0 0v3"/></svg>
                    },
                  ].map(({ key, icon, label, opts }) => (
                    <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
                      <div className="mb-1">{icon}</div>
                      <p className="text-xs text-gray-400 mb-2">{label}</p>
                      <select
                        value={form[key]}
                        onChange={(e) => set(key, Number(e.target.value))}
                        className="w-full text-center text-sm font-bold text-gray-900 dark:text-white bg-transparent outline-none cursor-pointer"
                      >
                        {opts.map((n) => (
                          <option key={n} value={n} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <Field label="Descripción" error={errors.description}>
                <textarea
                  placeholder="Describe la propiedad: acabados, amenidades, ubicación, ventajas..."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={5}
                  className={`${input} resize-none ${errors.description ? "ring-2 ring-red-400 border-red-300" : ""}`}
                />
              </Field>
            </div>
          </section>

          <div className="border-t border-gray-100 dark:border-gray-800"/>

          {/* ── SECCIÓN 3: FOTOS ── */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-7 h-7 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black flex items-center justify-center flex-shrink-0">3</span>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fotos</h2>
              </div>
              <span className="ml-auto text-xs text-gray-400">{form.images.length}/6</span>
            </div>

            {/* Grid de imágenes */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {form.images.map((img, i) => (
                  <div key={i} className="relative aspect-video rounded-xl overflow-hidden group bg-gray-100 dark:bg-gray-800">
                    <img src={img} alt="" className="w-full h-full object-cover"/>
                    {i === 0 && (
                      <span className="absolute top-2 left-2 bg-gray-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Portada
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1.5">
                      {i > 0 && (
                        <button type="button" onClick={() => moveImage(i, i - 1)}
                          className="w-7 h-7 rounded-lg bg-white/90 text-gray-800 text-xs font-bold hover:bg-white transition">←</button>
                      )}
                      <button type="button" onClick={() => removeImage(i)}
                        className="w-7 h-7 rounded-lg bg-white/90 text-gray-800 text-xs font-bold hover:bg-white transition">✕</button>
                      {i < form.images.length - 1 && (
                        <button type="button" onClick={() => moveImage(i, i + 1)}
                          className="w-7 h-7 rounded-lg bg-white/90 text-gray-800 text-xs font-bold hover:bg-white transition">→</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload */}
            {form.images.length < 6 && (
              <label className="block cursor-pointer">
                <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  uploading
                    ? "border-gray-400 bg-gray-50 dark:bg-gray-800"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}>
                  <p className="flex justify-center mb-2 text-gray-400">
                    {uploading ? <Loader2 size={26} strokeWidth={2} className="animate-spin" /> : <Plus size={26} strokeWidth={2} />}
                  </p>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {uploading ? "Subiendo..." : "Agregar fotos"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG · PNG · WEBP · Hasta 5 MB · {6 - form.images.length} restante{6 - form.images.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading}/>
              </label>
            )}
            <p className="text-xs text-gray-400 mt-2">
              La primera foto será la portada · Arrastra las flechas para reordenar
            </p>
          </section>

          {/* ── SUBMIT ── */}
          <div className="pt-2 pb-6">
            <motion.button
              type="submit"
              disabled={hasReachedLimit || submitting}
              whileHover={{ scale: submitting ? 1 : 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: submitting || hasReachedLimit
                  ? "#9ca3af"
                  : "#111827",
                color: "white",
              }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Publicando...
                </span>
              ) : "Publicar propiedad"}
            </motion.button>
            <p className="text-center text-xs text-gray-400 mt-3">
              Tu propiedad estará visible inmediatamente en el feed
            </p>
          </div>

        </form>
      </main>

      <Footer />
    </div>
  );
}