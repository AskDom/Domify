import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth, CSRF_HEADERS } from "./AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TYPE_MAP   = { APARTAMENTO: "Apartamento", CASA: "Casa", VILLA: "Villa" };
const STATUS_MAP = { VENTA: "Venta", RENTA: "Renta", VENDIDO: "Vendido", RENTADO: "Rentado" };

const normalizeProperty = (p) => ({
  ...p,
  type:   TYPE_MAP[p.type]     || p.type,
  status: STATUS_MAP[p.status] || p.status,
  image:  p.images?.[0] || "",
});

const PropertiesContext = createContext();

export function PropertiesProvider({ children }) {
  const { currentUser } = useAuth();

  const [properties,    setProperties]    = useState([]);
  const [pagination,    setPagination]    = useState({ page: 1, totalPages: 1, hasMore: false, total: 0 });
  const [favorites,     setFavorites]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("domify-favorites")) || []; }
    catch { return []; }
  });
  const [userProperties, setUserProperties] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // ── CARGAR PROPIEDADES (con filtros y paginación) ─────────────────────────
  const fetchProperties = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.city)     params.set("city",     filters.city);
      if (filters.type)     params.set("type",     filters.type);
      if (filters.status)   params.set("status",   filters.status);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.rooms)    params.set("rooms",    filters.rooms);
      if (filters.search)   params.set("search",   filters.search);
      if (filters.page)     params.set("page",     filters.page);
      params.set("limit", filters.limit || 12);

      const res  = await fetch(`${API_URL}/api/properties?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar propiedades");

      const normalized = data.properties.map(normalizeProperty);

      // Si es página 1 reemplazamos, si es página siguiente acumulamos (scroll infinito)
      if (!filters.page || filters.page === 1) {
        setProperties(normalized);
      } else {
        setProperties((prev) => [...prev, ...normalized]);
      }

      // El backend devuelve paginación anidada en data.pagination
      const pag = data.pagination || {};
      setPagination({
        page:       pag.page       || data.page       || 1,
        totalPages: pag.totalPages || data.totalPages || 1,
        hasMore:    pag.hasMore    ?? data.hasMore    ?? false,
        total:      pag.total      || data.total      || normalized.length,
      });
    } catch (err) {
      console.error("fetchProperties error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  // ── CARGAR MIS PROPIEDADES directo desde el backend ───────────────────────
  const fetchUserProperties = useCallback(async () => {
    if (!currentUser) { setUserProperties([]); return; }
    try {
      // ?publishedBy= filtra en el servidor (mismo criterio que la app móvil)
      // — antes se traía la primera página de TODO y se filtraba en el cliente,
      // lo que cortaba la lista a 100 propiedades y desperdiciaba el payload.
      const res  = await fetch(`${API_URL}/api/properties?publishedBy=${currentUser.id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return;
      setUserProperties(data.properties.map(normalizeProperty));
    } catch (err) {
      console.error("fetchUserProperties error:", err);
    }
  }, [currentUser]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchUserProperties(); }, [currentUser?.id]);

  // ── FAVORITOS ─────────────────────────────────────────────────────────────
  const fetchFavorites = useCallback(async () => {
    if (!currentUser) { setFavorites([]); localStorage.removeItem("domify-favorites"); return; }
    try {
      const res  = await fetch(`${API_URL}/api/favorites`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setFavorites(data.favorites);
      localStorage.setItem("domify-favorites", JSON.stringify(data.favorites));
    } catch (err) {
      console.error("fetchFavorites error:", err);
    }
  }, [currentUser]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchFavorites(); }, [currentUser?.id]);

  // ── PUBLICAR ──────────────────────────────────────────────────────────────
  const addProperty = useCallback(async (formData) => {
    try {
      const res = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...CSRF_HEADERS },
        body: JSON.stringify({
          title:       formData.title,
          description: formData.description,
          price:       formData.price,
          currency:    formData.currency || "USD",
          city:        formData.city,
          sector:      formData.sector || null,
          lat:         formData.lat,
          lng:         formData.lng,
          rooms:       formData.rooms,
          baths:       formData.baths,
          parking:     formData.parking,
          type:        (formData.type   || "Apartamento").toUpperCase(),
          status:      (formData.status || "Venta").toUpperCase(),
          images:      formData.images || [],
          userId:      formData.publishedById,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al publicar");
      const newProp = normalizeProperty(data.property);
      setProperties((prev) => [newProp, ...prev]);
      setUserProperties((prev) => [newProp, ...prev]);
      return newProp;
    } catch (err) {
      console.error("addProperty error:", err);
      throw err;
    }
  }, []);

  // ── ACTUALIZAR ────────────────────────────────────────────────────────────
  const updateProperty = useCallback(async (id, updates) => {
    try {
      const payload = { ...updates };
      if (payload.type)   payload.type   = payload.type.toUpperCase();
      if (payload.status) payload.status = payload.status.toUpperCase();
      const res  = await fetch(`${API_URL}/api/properties/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...CSRF_HEADERS },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar");
      const updated = normalizeProperty(data.property);
      setProperties((prev)     => prev.map((p) => p.id === id ? updated : p));
      setUserProperties((prev) => prev.map((p) => p.id === id ? updated : p));
      return updated;
    } catch (err) {
      console.error("updateProperty error:", err);
      throw err;
    }
  }, []);

  // ── ELIMINAR ──────────────────────────────────────────────────────────────
  const deleteProperty = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/properties/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: CSRF_HEADERS,
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error al eliminar"); }
      setProperties((prev)     => prev.filter((p) => p.id !== id));
      setUserProperties((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("deleteProperty error:", err);
      throw err;
    }
  }, []);

  // ── TOGGLE FAVORITO ───────────────────────────────────────────────────────
  const toggleFavorite = useCallback(async (id) => {
    if (!currentUser) return;
    const isCurrentlyFav = favorites.includes(id);
    setFavorites((prev) => {
      const next = isCurrentlyFav ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem("domify-favorites", JSON.stringify(next));
      return next;
    });
    try {
      await fetch(`${API_URL}/api/favorites/${id}`, {
        method: isCurrentlyFav ? "DELETE" : "POST",
        credentials: "include",
        headers: CSRF_HEADERS,
      });
    } catch (err) {
      console.error("toggleFavorite sync error:", err);
      setFavorites((prev) => {
        const reverted = isCurrentlyFav ? [...prev, id] : prev.filter((f) => f !== id);
        localStorage.setItem("domify-favorites", JSON.stringify(reverted));
        return reverted;
      });
    }
  }, [favorites, currentUser]);

  const isFavorite           = useCallback((id) => favorites.includes(id), [favorites]);
  const getUserProperties    = useCallback(() => userProperties, [userProperties]);
  const getFavoriteProperties = useCallback(
    () => properties.filter((p) => favorites.includes(p.id)),
    [properties, favorites]
  );
  // ── CARGAR MÁS (paginación) ───────────────────────────────────────────────
  const loadMore = useCallback((filters = {}) => {
    if (!pagination.hasMore) return;
    fetchProperties({ ...filters, page: pagination.page + 1 });
  }, [fetchProperties, pagination]);

  return (
    <PropertiesContext.Provider value={{
      allProperties: properties,
      published:     properties,
      favorites,
      loading,
      error,
      pagination,
      fetchProperties,
      loadMore,
      addProperty,
      updateProperty,
      deleteProperty,
      toggleFavorite,
      isFavorite,
      getUserProperties,
      getFavoriteProperties,
    }}>
      {children}
    </PropertiesContext.Provider>
  );
}

export function useProperties() {
  return useContext(PropertiesContext);
}