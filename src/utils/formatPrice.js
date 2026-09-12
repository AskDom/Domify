// "$" a secas es ambiguo en RD (suele leerse como peso dominicano) — por
// eso el dólar siempre se marca explícito como "US$", igual que ya hacía
// la app móvil. Nunca mostrar USD con un simple "$".
const SYMBOL = { USD: "US$", DOP: "RD$" };

export function getCurrencySymbol(currency = "USD") {
  return SYMBOL[currency] || "US$";
}

// Tasa aproximada, solo para poder comparar/ordenar precios en distinta
// moneda (ver toUsdEquivalent) — no se usa para mostrar montos converti-
// dos. Actualizar si el tipo de cambio se mueve mucho.
export const USD_TO_DOP_RATE = 60;

export function toUsdEquivalent(price, currency) {
  return currency === "DOP" ? price / USD_TO_DOP_RATE : price;
}

// Formato completo: RD$5,500,000 / US$95,000
export function formatPrice(price, currency = "USD") {
  return `${SYMBOL[currency] || "US$"}${Number(price).toLocaleString()}`;
}

// Formato corto para pines de mapa: RD$5.5M / US$95K
export function formatPriceShort(price, currency = "USD") {
  const symbol = SYMBOL[currency] || "US$";
  if (price >= 1000000) return `${symbol}${(price / 1000000).toFixed(1)}M`;
  if (price >= 1000) return `${symbol}${Math.round(price / 1000)}K`;
  return `${symbol}${price}`;
}

// Equivalencia en la otra moneda: "≈ RD$9,000,000" bajo "US$150,000". Es un
// valor orientativo para quien lee la moneda extranjera mejor en pesos (o
// viceversa) — la tasa viene de GET /api/rates vía useFxRate, nunca del
// cliente como dato de venta.
export function formatPriceEquivalent(price, currency = "USD", rate = 60) {
  if (!rate || rate <= 0) return null;
  if (currency === "USD") {
    return `≈ ${SYMBOL.DOP}${Math.round(price * rate).toLocaleString()}`;
  }
  return `≈ ${SYMBOL.USD}${Math.round(price / rate).toLocaleString()}`;
}
