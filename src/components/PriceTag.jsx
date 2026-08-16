import { getCurrencySymbol, formatPriceEquivalent } from "../utils/formatPrice";

// Reemplaza a formatPrice() en JSX donde el precio va destacado (tarjetas,
// detalle): el código de moneda se ve chico y liviano — no con el mismo
// tamaño y peso que el monto — para que no compita visualmente con el
// número. text-[0.6em] lo escala relativo al tamaño de fuente del texto
// donde se use, así funciona igual en una tarjeta chica que en el precio
// grande del detalle sin tener que ajustarlo en cada lugar.
export default function PriceTag({ price, currency }) {
  return (
    <>
      <span className="font-semibold opacity-60 text-[0.6em] mr-0.5 align-middle">
        {getCurrencySymbol(currency)}
      </span>
      {Number(price).toLocaleString()}
    </>
  );
}

// "≈ RD$9,000,000" bajo el precio original — la equivalencia en la otra
// moneda. Solo se renderiza si el padre le pasa `rate` (de useFxRate) para
// que los lugares donde no interesa (tarjetas, listados) no la muestren.
export function PriceEquivalent({ price, currency, rate }) {
  const text = formatPriceEquivalent(price, currency, rate);
  if (!text) return null;
  return (
    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
      {text}
    </span>
  );
}
