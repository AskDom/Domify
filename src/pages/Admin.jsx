import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, CSRF_HEADERS } from "../context/AuthContext";
import PriceTag from "../components/PriceTag";
import { formatLocation } from "../utils/formatLocation";
import { useToast } from "../context/ToastContext";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ROLE_COLORS = {
  ADMIN:    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  AGENTE:   "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  VENDEDOR: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CLIENTE:  "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
};

// El backend devuelve `tuRol` en los 403 de requireRole — lo usamos para
// dar una pista útil en vez de solo "acceso denegado" (ej. token viejo
// tras cambiar de rol manualmente, antes de volver a iniciar sesión).
function formatAdminError(data, status, what) {
  if (status === 403 && data.tuRol) {
    return `${data.error} Tu sesión actual todavía dice "${data.tuRol}" — si acabas de cambiar tu rol, cierra sesión y vuelve a entrar para refrescar el token.`;
  }
  return data.error || `No se pudieron cargar ${what} (${status}).`;
}

function StatCard({ label, value, sub, color = "blue" }) {
  const colors = {
    blue:   "from-blue-500 to-blue-600",
    green:  "from-green-500 to-green-600",
    amber:  "from-amber-500 to-amber-600",
    purple: "from-purple-500 to-purple-600",
    coral:  "from-rose-500 to-rose-600",
  };
  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br ${colors[color]} text-white shadow`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value ?? "—"}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </div>
  );
}

export default function Admin() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [tab,        setTab]        = useState("stats");
  const [stats,      setStats]      = useState(null);
  const [users,      setUsers]      = useState([]);
  const [properties, setProperties] = useState([]);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [busyId,     setBusyId]     = useState(null);  // `${accion}-${id}` en vuelo
  const [confirmId,  setConfirmId]  = useState(null);  // `${tipo}-${id}` pendiente de confirmar borrado

  // Redirigir si no es ADMIN
  useEffect(() => {
    if (currentUser && currentUser.role !== "Admin") navigate("/");
  }, [currentUser, navigate]);

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    ...CSRF_HEADERS,
  }), []);

  // ── FETCH ────────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/stats`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) { setStats(data); setError(""); }
      else setError(formatAdminError(data, res.status, "las estadísticas"));
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally { setLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/users?search=${encodeURIComponent(search)}&limit=50`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) { setUsers(data.users); setError(""); }
      else setError(formatAdminError(data, res.status, "los usuarios"));
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally { setLoading(false); }
  }, [search]);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/properties?search=${encodeURIComponent(search)}&limit=50`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) { setProperties(data.properties); setError(""); }
      else setError(formatAdminError(data, res.status, "las propiedades"));
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    if (tab === "stats")      fetchStats();
    if (tab === "users")      fetchUsers();
    if (tab === "properties") fetchProperties();
  }, [tab, fetchStats, fetchUsers, fetchProperties]);

  // ── ACCIONES ─────────────────────────────────────────────────────────────
  const changeRole = async (userId, role) => {
    setBusyId(`role-${userId}`);
    try {
      const res  = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { fetchUsers(); toast({ message: "Rol actualizado.", type: "success" }); }
      else toast({ message: data.error || "No se pudo actualizar el rol.", type: "error" });
    } catch {
      toast({ message: "No se pudo conectar con el servidor.", type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (userId) => {
    if (confirmId !== `user-${userId}`) { setConfirmId(`user-${userId}`); return; }
    setConfirmId(null);
    setBusyId(`user-delete-${userId}`);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: "DELETE", credentials: "include", headers: authHeaders(),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        toast({ message: "Usuario eliminado.", type: "success" });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ message: data.error || "No se pudo eliminar el usuario.", type: "error" });
      }
    } catch {
      toast({ message: "No se pudo conectar con el servidor.", type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const toggleVerify = async (propId, current) => {
    setBusyId(`verify-${propId}`);
    try {
      const res  = await fetch(`${API_URL}/api/admin/properties/${propId}/verify`, {
        method: "PATCH",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify({ verified: !current }),
      });
      if (res.ok) {
        setProperties((prev) => prev.map((p) => p.id === propId ? { ...p, verified: !current } : p));
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ message: data.error || "No se pudo actualizar la verificación.", type: "error" });
      }
    } catch {
      toast({ message: "No se pudo conectar con el servidor.", type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  // Verificación de cuenta (agentes/vendedores de confianza) — el mismo
  // sello que las propiedades, pero a nivel de usuario: aparece en su perfil
  // público y junto a su nombre en el detalle de sus propiedades.
  const toggleUserVerify = async (userId, current) => {
    setBusyId(`user-verify-${userId}`);
    try {
      const res  = await fetch(`${API_URL}/api/admin/users/${userId}/verify`, {
        method: "PATCH",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify({ verified: !current }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, verified: !current } : u));
        toast({ message: `Usuario ${!current ? "verificado" : "desverificado"}.`, type: "success" });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ message: data.error || "No se pudo actualizar la verificación.", type: "error" });
      }
    } catch {
      toast({ message: "No se pudo conectar con el servidor.", type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const removeProperty = async (propId) => {
    if (confirmId !== `prop-${propId}`) { setConfirmId(`prop-${propId}`); return; }
    setConfirmId(null);
    setBusyId(`prop-delete-${propId}`);
    try {
      const res = await fetch(`${API_URL}/api/admin/properties/${propId}`, {
        method: "DELETE", credentials: "include", headers: authHeaders(),
      });
      if (res.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== propId));
        toast({ message: "Propiedad eliminada.", type: "success" });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ message: data.error || "No se pudo eliminar la propiedad.", type: "error" });
      }
    } catch {
      toast({ message: "No se pudo conectar con el servidor.", type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  if (!currentUser || currentUser.role !== "Admin") return null;

  const tabs = ["stats", "users", "properties"];
  const tabLabel = { stats: "📊 Dashboard", users: "👥 Usuarios", properties: "🏠 Propiedades" };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Seo title="Panel de administración" noindex />
      <Navbar />
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("/")} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition text-xl">←</button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Panel de administración</h1>
        <span className="ml-auto text-xs text-gray-400">Domify Admin</span>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 flex gap-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(""); setConfirmId(null); }}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white"
            }`}
          >
            {tabLabel[t]}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto p-6">

        {/* ── ERROR ── */}
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3">
            <span className="text-lg shrink-0">⚠️</span>
            <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-600 dark:hover:text-red-200 text-lg leading-none"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        )}

        {/* ── STATS ── */}
        {tab === "stats" && stats && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard label="Usuarios"       value={stats.totalUsers}          color="blue"   />
              <StatCard label="Propiedades"    value={stats.totalProperties}     color="green"  />
              <StatCard label="Sin verificar"  value={stats.pendingVerification} color="amber"  sub="propiedades pendientes" />
              <StatCard label="Mensajes"       value={stats.totalMessages}       color="purple" />
              <StatCard label="Favoritos"      value={stats.totalFavorites}      color="coral"  />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Usuarios por rol</h3>
                <div className="space-y-3">
                  {stats.usersByRole.map((r) => (
                    <div key={r.role} className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[r.role]}`}>{r.role}</span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.totalUsers ? (r.count / stats.totalUsers) * 100 : 0}%` }}/>
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200 w-6 text-right">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Propiedades por tipo</h3>
                <div className="space-y-3">
                  {stats.propertiesByType.map((t) => (
                    <div key={t.type} className="flex items-center gap-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 w-28 text-center">{t.type}</span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.totalProperties ? (t.count / stats.totalProperties) * 100 : 0}%` }}/>
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200 w-6 text-right">{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── USUARIOS ── */}
        {tab === "users" && (
          <div className="space-y-4">
            <input
              type="text" value={search} placeholder="Buscar por nombre o email..."
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
              className="w-full max-w-md px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {["Usuario", "Email", "Rol", "Verificado", "Propiedades", "Acciones"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>}
                  {!loading && users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          disabled={busyId === `role-${u.id}`}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer disabled:opacity-50 ${ROLE_COLORS[u.role]}`}
                        >
                          {["CLIENTE", "VENDEDOR", "AGENTE", "ADMIN"].map((r) => (
                            <option key={r} value={r} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleUserVerify(u.id, u.verified)}
                          disabled={busyId === `user-verify-${u.id}`}
                          className={`text-xs font-semibold px-3 py-1 rounded-full transition disabled:opacity-50 ${
                            u.verified
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {busyId === `user-verify-${u.id}` ? "..." : u.verified ? "✓ Verificado" : "Sin verificar"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u._count?.properties ?? 0}</td>
                      <td className="px-4 py-3">
                        {confirmId === `user-${u.id}` ? (
                          <span className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-red-500 text-xs">¿Seguro?</span>
                            <button
                              onClick={() => removeUser(u.id)}
                              disabled={busyId === `user-delete-${u.id}`}
                              className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 px-2 py-1 rounded-lg transition"
                            >
                              {busyId === `user-delete-${u.id}` ? "..." : "Sí, eliminar"}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                            >
                              Cancelar
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => removeUser(u.id)}
                            disabled={u.id === currentUser.id}
                            className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium transition"
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}

        {/* ── PROPIEDADES ── */}
        {tab === "properties" && (
          <div className="space-y-4">
            <input
              type="text" value={search} placeholder="Buscar por título o ciudad..."
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchProperties()}
              className="w-full max-w-md px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {["Propiedad", "Ciudad", "Precio", "Publicado por", "Verificada", "Acciones"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>}
                  {!loading && properties.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.images?.[0] && <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0"/>}
                          <span className="font-medium text-gray-900 dark:text-white line-clamp-1">{p.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatLocation(p.city, p.sector)}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">
                        <PriceTag price={p.price} currency={p.currency} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.publishedBy?.name}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleVerify(p.id, p.verified)}
                          disabled={busyId === `verify-${p.id}`}
                          className={`text-xs font-semibold px-3 py-1 rounded-full transition disabled:opacity-50 ${
                            p.verified
                              ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                              : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-300"
                          }`}
                        >
                          {busyId === `verify-${p.id}` ? "..." : p.verified ? "✓ Verificada" : "Pendiente"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {confirmId === `prop-${p.id}` ? (
                          <span className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-red-500 text-xs">¿Seguro?</span>
                            <button
                              onClick={() => removeProperty(p.id)}
                              disabled={busyId === `prop-delete-${p.id}`}
                              className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 px-2 py-1 rounded-lg transition"
                            >
                              {busyId === `prop-delete-${p.id}` ? "..." : "Sí, eliminar"}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                            >
                              Cancelar
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => removeProperty(p.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium transition"
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}