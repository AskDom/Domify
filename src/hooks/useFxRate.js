import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const FALLBACK = 60;

// Tasa USD→DOP con caché a nivel de módulo: se pide una sola vez por sesión
// de navegación (y se reutiliza entre páginas), con fallback a 60 si el
// servidor no responde o aún no llegó. El backend la expone en GET /api/rates
// y se configura por env (FX_USD_TO_DOP).
let cached   = null;
let inflight = null;

export function useFxRate() {
  const [rate, setRate] = useState(cached?.usdToDop ?? FALLBACK);

  useEffect(() => {
    if (cached) return;
    if (inflight) {
      inflight.then((r) => r && setRate(r.usdToDop));
      return;
    }
    inflight = fetch(`${API_URL}/api/rates`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        cached = data;
        setRate(data?.usdToDop ?? FALLBACK);
        return data;
      })
      .catch(() => null)
      .finally(() => { inflight = null; });
  }, []);

  return rate;
}
