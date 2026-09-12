import { Helmet } from "react-helmet-async";

// index.html trae un <title>/description/OG genéricos para el primer paint
// (y para cualquier bot que no ejecute JS) — este componente los reemplaza
// una vez que React monta, para que cada ruta tenga su propio título en la
// pestaña, en resultados de Google y al compartir el link.
//
// SITE_URL es la base para las URLs absolutas que exige Open Graph
// (og:image en particular — muchos clientes ignoran rutas relativas). Se
// puede pisar con VITE_SITE_URL una vez que haya dominio definitivo.
export const SITE_URL = import.meta.env.VITE_SITE_URL || "https://real-estate-pi-ashen.vercel.app";
const DEFAULT_IMAGE = `${SITE_URL}/logo512.png`;

function absoluteUrl(path) {
  if (!path) return SITE_URL;
  return path.startsWith("http") ? path : `${SITE_URL}${path}`;
}

export default function Seo({
  title,
  description,
  path = "",
  image,
  type = "website",
  noindex = false,
  jsonLd,
}) {
  const fullTitle = title ? `${title} | Domify` : "Domify — Portal inmobiliario dominicano";
  const canonical = absoluteUrl(path);
  const ogImage   = absoluteUrl(image) || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />

      {/* JSON.stringify ya omite las claves en undefined — el llamador no
          necesita limpiar campos opcionales antes de pasarlos acá. */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
