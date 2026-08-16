import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Star, Home as HomeIcon, User as UserIcon, Plus, Loader2, X, MoreVertical, Eye, Pencil, Flag, Undo2, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import { useAuth, CSRF_HEADERS } from "../context/AuthContext";
import { useProperties } from "../context/PropertiesContext";
import { useToast } from "../context/ToastContext";
import PriceTag from "../components/PriceTag";
import { formatLocation } from "../utils/formatLocation";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ROLE_CONFIG = {
  Admin:    { label: "Admin",    Icon: ShieldCheck, bg: "from-purple-500 to-purple-600" },
  Agente:   { label: "Agente",   Icon: Star,        bg: "from-amber-500 to-orange-500"  },
  Vendedor: { label: "Vendedor", Icon: HomeIcon,    bg: "from-green-500 to-emerald-600" },
  Cliente:  { label: "Cliente",  Icon: UserIcon,    bg: "from-blue-500 to-blue-600"     },
};

function StatCard({ value, label, color = "text-gray-900 dark:text-white" }) {
  return (
    <div className="text-center">
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      <p className="text-gray-400 text-xs mt-0.5">{label}</p>
    </div>
  );
}

const STATUS_STYLES = {
  PENDIENTE:  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  CONFIRMADA: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  CANCELADA:  "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
  COMPLETADA: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

function StatusPill({ status }) {
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

function PropertyCard({ prop, onEdit, onDelete, onStatusChange, confirmDelete, setConfirmDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statusColor = {
    Venta:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    Renta:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    Vendido: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
    Rentado: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Confirmar borrar */}
      <AnimatePresence>
        {confirmDelete === prop.id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3 flex items-center justify-between"
          >
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">¿Eliminar esta propiedad?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)}
                className="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium">
                Cancelar
              </button>
              <button onClick={() => onDelete(prop.id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-bold">
                Eliminar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-0">
        {/* Imagen */}
        <div className="relative w-32 flex-shrink-0">
          {prop.image ? (
            <img src={prop.image} alt={prop.title} className="w-full h-full object-cover"/>
          ) : (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-3xl">🏠</div>
          )}
          {prop.verified && (
            <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
              ✓ Verificada
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusColor[prop.status] || statusColor.Venta}`}>
                  {prop.status}
                </span>
                <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {prop.type}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-1">{prop.title}</h3>
              <p className="text-blue-600 dark:text-blue-400 font-black text-base mt-0.5">
                <PriceTag price={prop.price} currency={prop.currency} />
              </p>
              <div className="flex gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12V7a2 2 0 012-2h14a2 2 0 012 2v5M3 12h18M3 12v5a2 2 0 002 2h14a2 2 0 002-2v-5M7 12V9a1 1 0 011-1h8a1 1 0 011 1v3"/></svg>
                  {prop.rooms}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 12a2 2 0 01-2-2V7a2 2 0 012-2h1m15 7a2 2 0 002-2V7a2 2 0 00-2-2h-1M4 12v5a2 2 0 002 2h12a2 2 0 002-2v-5M5 7V5a2 2 0 012-2h1"/></svg>
                  {prop.baths}
                </span>
                {prop.parking > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="13" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M9 12h2.5a1.5 1.5 0 010 3H9v-3zm0 0v3"/></svg>
                    {prop.parking}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {formatLocation(prop.city, prop.sector)}
                </span>
              </div>
            </div>

            {/* Menú acciones */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <MoreVertical size={16} strokeWidth={2.25} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute right-0 top-9 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-10 overflow-hidden"
                  >
                    <Link to={`/property/${prop.id}`} onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <Eye size={15} strokeWidth={2.25} /> Ver propiedad
                    </Link>
                    <button onClick={() => { onEdit(prop); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <Pencil size={15} strokeWidth={2.25} /> Editar
                    </button>
                    {(prop.status === "Venta" || prop.status === "Vendido") && (
                      <button onClick={() => { onStatusChange(prop.id, prop.status === "Venta" ? "Vendido" : "Venta"); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        {prop.status === "Venta" ? <Flag size={15} strokeWidth={2.25} /> : <Undo2 size={15} strokeWidth={2.25} />}
                        {prop.status === "Venta" ? "Marcar vendido" : "Volver a venta"}
                      </button>
                    )}
                    {(prop.status === "Renta" || prop.status === "Rentado") && (
                      <button onClick={() => { onStatusChange(prop.id, prop.status === "Renta" ? "Rentado" : "Renta"); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        {prop.status === "Renta" ? <Flag size={15} strokeWidth={2.25} /> : <Undo2 size={15} strokeWidth={2.25} />}
                        {prop.status === "Renta" ? "Marcar rentado" : "Volver a renta"}
                      </button>
                    )}
                    <div className="border-t border-gray-100 dark:border-gray-700"/>
                    <button onClick={() => { setConfirmDelete(prop.id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                      <Trash2 size={15} strokeWidth={2.25} /> Eliminar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EditModal({ prop, editForm, setEditForm, onSave, onClose, uploadingEdit, onImageUpload, onRemoveImage }) {
  const inputClass = "w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "88vh", overflowY: "auto" }}
      >
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h3 className="font-black text-gray-900 dark:text-white">Editar propiedad</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-xl">×</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Título</label>
            <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className={inputClass}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Precio</label>
              <div className="flex gap-2">
                {/* inputClass ya trae w-full — cada control va en su propio
                    contenedor con el ancho real, si no compiten entre sí. */}
                <div className="w-24 flex-shrink-0">
                  <select
                    value={editForm.currency || "USD"}
                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                    className={`${inputClass} px-2`}
                  >
                    <option value="USD" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">USD</option>
                    <option value="DOP" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">RD$</option>
                  </select>
                </div>
                <div className="flex-1 min-w-0">
                  <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className={inputClass}/>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Operación</label>
              <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className={inputClass}>
                <option className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Venta</option>
                <option className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Renta</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Tipo</label>
            <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className={inputClass}>
              <option className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Apartamento</option>
              <option className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Casa</option>
              <option className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">Villa</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Descripción</label>
            <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className={`${inputClass} resize-none`}/>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Video (opcional)</label>
            <input
              placeholder="https://www.youtube.com/watch?v=..."
              value={editForm.videoUrl || ""}
              onChange={(e) => setEditForm({ ...editForm, videoUrl: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Tour virtual 360° (opcional)</label>
            <input
              placeholder="https://my.matterport.com/show/?m=..."
              value={editForm.virtualTourUrl || ""}
              onChange={(e) => setEditForm({ ...editForm, virtualTourUrl: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Fotos */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
              Fotos ({(editForm.images || []).length}/6)
            </label>
            <div className="flex flex-wrap gap-2">
              {(editForm.images || []).map((url, i) => (
                <div key={i} className="relative group w-20 h-20">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-xl"/>
                  {i === 0 && <span className="absolute bottom-0 inset-x-0 text-center text-white text-[9px] font-bold bg-black/50 rounded-b-xl py-0.5">portada</span>}
                  <button onClick={() => onRemoveImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <X size={11} strokeWidth={3} />
                  </button>
                </div>
              ))}
              {(editForm.images || []).length < 6 && (
                <label className="w-20 h-20 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition text-gray-400">
                  {uploadingEdit ? <Loader2 size={18} strokeWidth={2} className="animate-spin" /> : <Plus size={18} strokeWidth={2} />}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={onImageUpload} disabled={uploadingEdit}/>
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Cancelar
          </button>
          <button onClick={onSave} className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition" style={{ background: "#111827" }}>
            Guardar cambios
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AccountModal({ form, password, setForm, setPassword, onSave, onClose, saving }) {
  const inputClass = "w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition";
  const labelClass = "text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "88vh", overflowY: "auto" }}
      >
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h3 className="font-black text-gray-900 dark:text-white">Editar perfil</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-xl">×</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Nombre completo</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass}/>
          </div>
          <div>
            <label className={labelClass}>Correo</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass}/>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <label className="text-sm font-bold text-gray-900 dark:text-white block">Cambiar contraseña</label>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">Dejá estos campos vacíos si no querés cambiarla.</p>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Contraseña actual</label>
                <input type="password" value={password.current} onChange={(e) => setPassword({ ...password, current: e.target.value })} className={inputClass}/>
              </div>
              <div>
                <label className={labelClass}>Contraseña nueva (mínimo 8 caracteres)</label>
                <input type="password" value={password.new} onChange={(e) => setPassword({ ...password, new: e.target.value })} className={inputClass}/>
              </div>
              <div>
                <label className={labelClass}>Confirmar contraseña nueva</label>
                <input type="password" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} className={inputClass}/>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Cancelar
          </button>
          <button onClick={onSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-60" style={{ background: "#111827" }}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "propiedades";
  const { currentUser, logout, updateAvatar } = useAuth();
  const { getFavoriteProperties, getUserProperties, deleteProperty, updateProperty } = useProperties();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [editingProp,    setEditingProp]    = useState(null);
  const [editForm,       setEditForm]       = useState({});
  const [confirmDelete,  setConfirmDelete]  = useState(null);
  const [uploadingEdit,  setUploadingEdit]  = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savedSearches,  setSavedSearches]  = useState([]);
  const [loadingSaved,   setLoadingSaved]   = useState(false);

  // ── VISITAS (agenda) ─────────────────────────────────────────────────────
  const [visits,          setVisits]          = useState([]); // solicitudes que hice
  const [receivedVisits,  setReceivedVisits]  = useState([]); // a mis propiedades
  const [loadingVisits,   setLoadingVisits]   = useState(false);
  const [visitStatusBusy, setVisitStatusBusy] = useState(null);

  const fetchVisits = useCallback(async () => {
    setLoadingVisits(true);
    try {
      const [mine, received] = await Promise.all([
        fetch(`${API_URL}/api/visits/mine`, { credentials: "include" }),
        fetch(`${API_URL}/api/visits/received`, { credentials: "include" }),
      ]);
      const mineData     = mine.ok ? await mine.json() : { visits: [] };
      const receivedData = received.ok ? await received.json() : { visits: [] };
      setVisits(mineData.visits);
      setReceivedVisits(receivedData.visits);
    } finally {
      setLoadingVisits(false);
    }
  }, []);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  const changeVisitStatus = async (id, status) => {
    setVisitStatusBusy(`${id}-${status}`);
    try {
      const res = await fetch(`${API_URL}/api/visits/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...CSRF_HEADERS },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar la visita.");
      await fetchVisits();
      const msg = { CONFIRMADA: "Visita confirmada ✅", CANCELADA: "Visita cancelada", COMPLETADA: "Visita completada 🎉" }[status];
      toast({ message: msg || "Visita actualizada", type: "success" });
    } catch (err) {
      toast({ message: err.message, type: "error" });
    } finally {
      setVisitStatusBusy(null);
    }
  };

  const fetchSavedSearches = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const res  = await fetch(`${API_URL}/api/saved-searches`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setSavedSearches(data.searches);
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  useEffect(() => { fetchSavedSearches(); }, [fetchSavedSearches]);

  const deleteSavedSearch = async (id) => {
    const res = await fetch(`${API_URL}/api/saved-searches/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: CSRF_HEADERS,
    });
    if (res.ok) {
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
      toast({ message: "Búsqueda eliminada", type: "info" });
    }
  };

  const savedSearchUrl = (filters) => {
    const params = new URLSearchParams();
    if (filters.search)   params.set("q", filters.search);
    if (filters.status)   params.set("status", filters.status);
    if (filters.type)     params.set("type", filters.type);
    if (filters.rooms)    params.set("rooms", filters.rooms);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    return `/search?${params.toString()}`;
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const result = await updateAvatar(file);
      if (result) toast({ message: "Foto de perfil actualizada ✅", type: "success" });
      else toast({ message: "No se pudo actualizar la foto de perfil.", type: "error" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <p className="text-5xl mb-4">🔒</p>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Acceso restringido</h2>
          <p className="text-gray-500 mb-6">Debes iniciar sesión para ver tu perfil</p>
          <Link to="/" className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-gray-700 transition">Ir al inicio</Link>
        </div>
      </div>
    );
  }

  const myProperties       = getUserProperties();
  const favoriteProperties = getFavoriteProperties();
  const roleConfig         = ROLE_CONFIG[currentUser.role] || ROLE_CONFIG.Cliente;

  const startEdit = (prop) => {
    setEditingProp(prop);
    setEditForm({
      title:       prop.title,
      price:       prop.price,
      currency:    prop.currency || "USD",
      status:      prop.status,
      type:        prop.type,
      description: prop.description,
      images:      prop.images || (prop.image ? [prop.image] : []),
      videoUrl:       prop.videoUrl || "",
      virtualTourUrl: prop.virtualTourUrl || "",
    });
  };

  const handleEditImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 6 - (editForm.images?.length || 0));
    if (!files.length) return;
    setUploadingEdit(true);
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
      setEditForm((p) => ({ ...p, images: [...(p.images || []), ...data.urls] }));
    } catch (err) {
      toast({ message: err.message, type: "error" });
    } finally {
      setUploadingEdit(false);
    }
  };

  const saveEdit = async () => {
    try {
      await updateProperty(editingProp.id, editForm);
      setEditingProp(null);
      toast({ message: "Propiedad actualizada", type: "success" });
    } catch (err) {
      toast({ message: err.message || "Error al guardar", type: "error" });
    }
  };

  const handleDelete = (id) => {
    deleteProperty(id);
    setConfirmDelete(null);
    toast({ message: "Propiedad eliminada", type: "info" });
  };

  const handleStatusChange = (id, status) => {
    updateProperty(id, { status });
    const msg = { Vendido: "Marcada como Vendida 🎉", Rentado: "Marcada como Rentada 🎉", Venta: "Volvió a En Venta", Renta: "Volvió a En Renta" };
    toast({ message: msg[status] || "Estado actualizado", type: "success" });
  };

  const tabs = [
    { key: "propiedades", label: "Propiedades", count: myProperties.length },
    { key: "favoritos",   label: "Favoritos",   count: favoriteProperties.length },
    { key: "visitas",     label: "Visitas",     count: visits.length + receivedVisits.length },
    { key: "guardadas",   label: "Búsquedas",   count: savedSearches.length },
    { key: "cuenta",      label: "Mi cuenta" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Seo title="Mi perfil" noindex />
      <Navbar />

      {/* ── COVER / HEADER ── */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-6 flex items-center gap-5">
            {/* Avatar */}
            <label className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex-shrink-0 cursor-pointer group">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover shadow-md" />
              ) : (
                <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br ${roleConfig.bg} flex items-center justify-center text-white text-4xl font-black shadow-md`}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 rounded-3xl bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-colors">
                {uploadingAvatar ? (
                  <span className="text-white text-xs animate-pulse">...</span>
                ) : (
                  <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">📷</span>
                )}
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
            </label>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">{currentUser.name}</h1>
                {currentUser.verified && (
                  <span
                    title="Cuenta verificada por Domify"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full"
                  >
                    ✓ Verificado
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full text-white bg-gradient-to-r ${roleConfig.bg}`}>
                  <roleConfig.Icon size={11} strokeWidth={2.5} /> {roleConfig.label}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1">{currentUser.email}</p>
            </div>
            {/* Cerrar sesión */}
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="text-xs text-gray-400 hover:text-red-500 font-medium transition flex items-center gap-1.5 flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16 -mt-4">

        {/* Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 mb-6 grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700">
          <StatCard value={myProperties.length} label="Publicaciones" color="text-blue-600 dark:text-blue-400" />
          <StatCard value={favoriteProperties.length} label="Favoritos" color="text-rose-500 dark:text-rose-400" />
          <StatCard value={myProperties.filter(p => p.verified).length} label="Verificadas" color="text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSearchParams({ tab: tab.key })}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300"
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── MIS PROPIEDADES ── */}
        <AnimatePresence mode="wait">
          {activeTab === "propiedades" && (
            <motion.div key="props" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {myProperties.length} propiedad{myProperties.length !== 1 ? "es" : ""} publicada{myProperties.length !== 1 ? "s" : ""}
                </p>
                <Link to="/publish"
                  className="text-sm font-semibold text-white px-4 py-2 rounded-xl transition"
                  style={{ background: "#111827" }}>
                  + Publicar
                </Link>
              </div>

              {myProperties.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-5xl mb-3">🏚️</p>
                  <p className="text-gray-600 dark:text-gray-400 font-semibold mb-4">No has publicado ninguna propiedad</p>
                  <Link to="/publish" className="text-sm font-bold text-blue-600 hover:underline">Publicar ahora →</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myProperties.map((prop) => (
                    <PropertyCard
                      key={prop.id}
                      prop={prop}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                      confirmDelete={confirmDelete}
                      setConfirmDelete={setConfirmDelete}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── FAVORITOS ── */}
          {activeTab === "favoritos" && (
            <motion.div key="favs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {favoriteProperties.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-5xl mb-3">🤍</p>
                  <p className="text-gray-600 dark:text-gray-400 font-semibold mb-4">No tienes propiedades guardadas</p>
                  <Link to="/" className="text-sm font-bold text-blue-600 hover:underline">Explorar propiedades →</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteProperties.map((prop) => (
                    <Link key={prop.id} to={`/property/${prop.id}`}>
                      <div className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                        <div className="relative overflow-hidden h-40">
                          {prop.image
                            ? <img src={prop.image} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                            : <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-4xl">🏠</div>
                          }
                          <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-xs font-bold ${prop.status === "Venta" ? "bg-blue-600 text-white" : "bg-emerald-500 text-white"}`}>
                            {prop.status}
                          </span>
                        </div>
                        <div className="p-3.5">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{prop.title}</h3>
                          <p className="text-blue-600 dark:text-blue-400 font-black mt-0.5"><PriceTag price={prop.price} currency={prop.currency} /></p>
                          <div className="flex gap-3 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-gray-400 text-xs">
                            <span>🛏 {prop.rooms}</span>
                            <span>🛁 {prop.baths}</span>
                            <span>📍 {formatLocation(prop.city, prop.sector)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── VISITAS (AGENDA) ── */}
          {activeTab === "visitas" && (
            <motion.div key="visits" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {loadingVisits ? (
                <div className="text-center py-16 text-gray-400">Cargando...</div>
              ) : (visits.length === 0 && receivedVisits.length === 0) ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-5xl mb-3">📅</p>
                  <p className="text-gray-600 dark:text-gray-400 font-semibold mb-4">Todavía no tienes visitas agendadas</p>
                  <p className="text-sm text-gray-400">Entra a cualquier propiedad y usa "Agendar una visita".</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Recibidas — solo las ve quien publica (el backend lo protege) */}
                  {receivedVisits.length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        Visitas a mis propiedades
                        <span className="text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full">{receivedVisits.length}</span>
                      </h3>
                      <div className="space-y-3">
                        {receivedVisits.map((v) => (
                          <div key={v.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{v.property?.title}</p>
                                <p className="text-gray-400 text-xs mt-1">
                                  {new Date(v.scheduledAt).toLocaleString("es-DO", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                  Solicita: <span className="font-semibold text-gray-700 dark:text-gray-200">{v.user?.name}</span>
                                </p>
                                {v.message && <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 italic">"{v.message}"</p>}
                              </div>
                              <StatusPill status={v.status} />
                            </div>
                            {v.status === "PENDIENTE" && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => changeVisitStatus(v.id, "CONFIRMADA")}
                                  disabled={visitStatusBusy === `${v.id}-CONFIRMADA`}
                                  className="flex-1 text-xs font-bold text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 px-3 py-2 rounded-xl transition"
                                >
                                  {visitStatusBusy === `${v.id}-CONFIRMADA` ? "..." : "Confirmar"}
                                </button>
                                <button
                                  onClick={() => changeVisitStatus(v.id, "CANCELADA")}
                                  disabled={visitStatusBusy === `${v.id}-CANCELADA`}
                                  className="flex-1 text-xs font-bold text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 px-3 py-2 rounded-xl transition"
                                >
                                  {visitStatusBusy === `${v.id}-CANCELADA` ? "..." : "Cancelar"}
                                </button>
                              </div>
                            )}
                            {v.status === "CONFIRMADA" && (
                              <button
                                onClick={() => changeVisitStatus(v.id, "COMPLETADA")}
                                disabled={visitStatusBusy === `${v.id}-COMPLETADA`}
                                className="mt-3 w-full text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 px-3 py-2 rounded-xl transition"
                              >
                                {visitStatusBusy === `${v.id}-COMPLETADA` ? "..." : "Marcar como completada"}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Solicitadas por mí */}
                  {visits.length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        Mis solicitudes
                        <span className="text-xs font-bold text-white bg-emerald-600 px-2 py-0.5 rounded-full">{visits.length}</span>
                      </h3>
                      <div className="space-y-3">
                        {visits.map((v) => (
                          <div key={v.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-start justify-between gap-3 flex-wrap">
                            <div className="min-w-0">
                              <Link to={`/property/${v.propertyId}`} className="font-bold text-gray-900 dark:text-white text-sm truncate hover:underline">
                                {v.property?.title}
                              </Link>
                              <p className="text-gray-400 text-xs mt-1">
                                {new Date(v.scheduledAt).toLocaleString("es-DO", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                              </p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Vendedor: {v.property?.publishedBy?.name}</p>
                              {v.message && <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 italic">"{v.message}"</p>}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <StatusPill status={v.status} />
                              {v.status === "PENDIENTE" && (
                                <button
                                  onClick={() => changeVisitStatus(v.id, "CANCELADA")}
                                  disabled={visitStatusBusy === `${v.id}-CANCELADA`}
                                  className="text-xs font-bold text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 px-3 py-1.5 rounded-xl transition"
                                >
                                  {visitStatusBusy === `${v.id}-CANCELADA` ? "..." : "Cancelar solicitud"}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ── BÚSQUEDAS GUARDADAS ── */}
          {activeTab === "guardadas" && (
            <motion.div key="saved" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {loadingSaved ? (
                <div className="text-center py-16 text-gray-400">Cargando...</div>
              ) : savedSearches.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-5xl mb-3">💾</p>
                  <p className="text-gray-600 dark:text-gray-400 font-semibold mb-4">No tienes búsquedas guardadas</p>
                  <Link to="/search" className="text-sm font-bold text-blue-600 hover:underline">Buscar propiedades →</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedSearches.map((s) => (
                    <div key={s.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{s.name}</p>
                        <p className="text-gray-400 text-xs mt-1 truncate">
                          {Object.entries(s.filters).map(([k, v]) => `${k}: ${v}`).join(" · ") || "Sin filtros"}
                        </p>
                      </div>
                      <Link
                        to={savedSearchUrl(s.filters)}
                        className="text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition whitespace-nowrap"
                      >
                        Ver resultados →
                      </Link>
                      <button
                        onClick={() => deleteSavedSearch(s.id)}
                        className="text-gray-300 hover:text-red-500 transition"
                        title="Eliminar"
                      >
                        <X size={16} strokeWidth={2.25} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── MI CUENTA ── */}
          {activeTab === "cuenta" && (
            <motion.div key="account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white">Información de cuenta</h3>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { label: "Nombre completo", value: currentUser.name,  icon: "👤" },
                    { label: "Correo",           value: currentUser.email, icon: "📧" },
                    { label: "Tipo de cuenta",   value: roleConfig.label,  icon: "🏷️" },
                    { label: "ID de usuario",    value: currentUser.id?.slice(0, 8) + "...", icon: "🔑" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm">{item.icon}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-4 bg-gray-50 dark:bg-gray-700/40 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-400 flex items-center gap-2">
                    <span>🔒</span> Tus datos están protegidos con cifrado de extremo a extremo
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de edición */}
      <AnimatePresence>
        {editingProp && (
          <EditModal
            prop={editingProp}
            editForm={editForm}
            setEditForm={setEditForm}
            onSave={saveEdit}
            onClose={() => setEditingProp(null)}
            uploadingEdit={uploadingEdit}
            onImageUpload={handleEditImageUpload}
            onRemoveImage={(i) => setEditForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}