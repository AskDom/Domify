const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let initialized = false;

// Carga gtag.js solo si hay un Measurement ID configurado. Sin esto, la app
// no hace ninguna petición a Google ni carga ningún script de analítica.
export function initAnalytics() {
  if (!GA_ID || initialized) return;
  initialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag("js", new Date());
  // send_page_view en false porque en una SPA cada cambio de ruta no recarga
  // la página — mandamos el page_view nosotros mismos en cada navegación
  // (ver trackPageView, llamado desde App.js en cada cambio de ubicación).
  gtag("config", GA_ID, { send_page_view: false });
}

export function trackPageView(path) {
  if (!GA_ID || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", { page_path: path });
}
