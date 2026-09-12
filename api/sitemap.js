// Vercel serverless function — sirve /sitemap.xml (ver rewrite en vercel.json).
// Se genera en cada request (con cache de una hora) en vez de en build time:
// esta es una SPA, así que un sitemap estático quedaría desactualizado hasta
// el próximo deploy cada vez que se publica o borra una propiedad.

const API_URL  = process.env.VITE_API_URL  || "http://localhost:5000";
const SITE_URL = process.env.VITE_SITE_URL || "https://real-estate-pi-ashen.vercel.app";

// Techo de páginas a recorrer contra el backend — cubre hasta 10,000
// propiedades. Es solo un cinturón de seguridad para que un bug en
// "hasMore" nunca deje a esta función en un loop infinito.
const MAX_PAGES = 200;
const PAGE_SIZE = 50;

const STATIC_PATHS = ["/", "/search", "/terminos", "/privacidad", "/cookies"];

async function fetchAllPropertyIds() {
  const ids = [];
  let page = 1;

  while (page <= MAX_PAGES) {
    const res = await fetch(`${API_URL}/api/properties?limit=${PAGE_SIZE}&page=${page}`);
    if (!res.ok) break;
    const data = await res.json();

    for (const p of data.properties || []) {
      ids.push({ id: p.id, updatedAt: p.updatedAt });
    }

    if (!data.pagination?.hasMore) break;
    page += 1;
  }

  return ids;
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  }[c]));
}

function urlEntry(loc, lastmod) {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""}\n  </url>`;
}

module.exports = async function handler(req, res) {
  let properties = [];
  try {
    properties = await fetchAllPropertyIds();
  } catch (err) {
    // Si el backend no responde, seguimos sirviendo un sitemap con las
    // páginas estáticas en vez de romper la request entera — un sitemap
    // parcial es mejor que un 500 para quien lo esté leyendo (Google, Bing).
    console.error("sitemap: no se pudieron obtener las propiedades:", err.message);
  }

  const urls = [
    ...STATIC_PATHS.map((path) => urlEntry(`${SITE_URL}${path}`)),
    ...properties.map((p) => urlEntry(`${SITE_URL}/property/${p.id}`, p.updatedAt)),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  // stale-while-revalidate: los crawlers reciben la versión cacheada al
  // instante mientras Vercel arma la siguiente en segundo plano — no hay
  // que pagar el costo de recorrer todas las propiedades en cada visita.
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
};
