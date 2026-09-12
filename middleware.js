// Vercel Edge Middleware — corre antes de servir cualquier request.
//
// react-helmet-async (ver src/components/Seo.jsx) solo actualiza el <head>
// DESPUÉS de que React monta en el navegador. Eso le alcanza a Google (que
// sí ejecuta JS), pero WhatsApp, Facebook, Twitter y la mayoría de bots que
// arman previews de links NO ejecutan JavaScript — solo leen el HTML tal
// cual lo devuelve el servidor. Sin esto, compartir un link de propiedad
// siempre mostraba el logo/título genérico de Domify.
//
// Esto solo intercepta a esos bots (por user-agent) en las rutas con
// contenido dinámico por :id — un usuario real nunca pasa por acá, sigue
// yendo a la SPA de siempre servida por vercel.json.
//
// Nota: los helpers de precio/ubicación están duplicados a propósito en vez
// de importados de src/utils — el Edge Runtime de Vercel bundlea este
// archivo por separado del build de Vite, y mantenerlo autocontenido evita
// depender de que ese bundling cruzado resuelva bien las rutas relativas.

export const config = {
  matcher: ["/property/:id", "/agent/:id"],
};

const API_URL  = process.env.VITE_API_URL  || "http://localhost:5000";
const SITE_URL = process.env.VITE_SITE_URL || "https://real-estate-pi-ashen.vercel.app";

const BOT_UA = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|WhatsApp|Discordbot|SkypeUriPreview|Pinterest|redditbot|Applebot|Googlebot|bingbot|DuckDuckBot|YandexBot/i;

const CURRENCY_SYMBOL = { USD: "US$", DOP: "RD$" };
function formatPrice(price, currency = "USD") {
  return `${CURRENCY_SYMBOL[currency] || "US$"}${Number(price).toLocaleString()}`;
}

function formatLocation(city, sector) {
  return sector ? `${sector}, ${city}` : city || "República Dominicana";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function absoluteUrl(path) {
  if (!path) return SITE_URL;
  return path.startsWith("http") ? path : `${SITE_URL}${path}`;
}

async function metaForProperty(id) {
  const res = await fetch(`${API_URL}/api/properties/${id}`);
  if (!res.ok) return null;
  const property = await res.json();

  return {
    title: `${property.title} — ${formatPrice(property.price, property.currency)}`,
    description:
      property.description?.length > 160
        ? `${property.description.slice(0, 157)}...`
        : property.description || `${property.title} en ${formatLocation(property.city, property.sector)}. Publicado en Domify.`,
    path: `/property/${property.id}`,
    image: property.images?.[0],
    type: "article",
  };
}

async function metaForAgent(id) {
  const res = await fetch(`${API_URL}/api/users/${id}`);
  if (!res.ok) return null;
  const { user } = await res.json();

  return {
    title: `${user.name} — Perfil en Domify`,
    description: `Propiedades publicadas por ${user.name} en Domify, el portal inmobiliario dominicano.`,
    path: `/agent/${user.id}`,
    image: user.avatar,
    type: "profile",
  };
}

function injectMeta(html, { title, description, path, image, type }) {
  const fullTitle  = escapeHtml(`${title} | Domify`);
  const desc       = escapeHtml(description);
  const canonical  = absoluteUrl(path);
  const ogImage    = absoluteUrl(image) || `${SITE_URL}/logo512.png`;

  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${fullTitle}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${desc}" />`)
    .replace(/<meta property="og:type" content="[^"]*" \/>/, `<meta property="og:type" content="${escapeHtml(type)}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${fullTitle}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${desc}" />`)
    .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${escapeHtml(ogImage)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${fullTitle}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${desc}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`)
    .replace("</head>", `    <link rel="canonical" href="${escapeHtml(canonical)}" />\n  </head>`);
}

export default async function middleware(request) {
  const ua = request.headers.get("user-agent") || "";
  if (!BOT_UA.test(ua)) return; // usuario real — sigue a la SPA de siempre

  const url = new URL(request.url);
  const propertyMatch = url.pathname.match(/^\/property\/([^/]+)\/?$/);
  const agentMatch     = url.pathname.match(/^\/agent\/([^/]+)\/?$/);

  let meta = null;
  try {
    if (propertyMatch) meta = await metaForProperty(propertyMatch[1]);
    else if (agentMatch) meta = await metaForAgent(agentMatch[1]);
  } catch (err) {
    console.error("middleware: no se pudo obtener el meta dinámico:", err.message);
  }

  if (!meta) return; // no encontramos datos — dejamos pasar a la SPA de siempre

  const html = await (await fetch(new URL("/index.html", request.url))).text();

  return new Response(injectMeta(html, meta), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
