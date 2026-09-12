import React, { useState, useMemo } from "react";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { formatPrice, USD_TO_DOP_RATE } from "../utils/formatPrice";

const DR_BANKS = [
  { name: "BanReservas", rate: 17.5 },
  { name: "Banco Popular", rate: 16.0 },
  { name: "Banco Santa Cruz", rate: 18.0 },
  { name: "Popular Dominicano", rate: 15.5 },
  { name: "Banco Leon", rate: 17.0 },
  { name: "Personalizado", rate: null },
];

function calcMonthlyPayment(principal, annualRatePct, years) {
  if (principal <= 0 || years <= 0) return 0;
  if (annualRatePct <= 0) return principal / (years * 12);
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export default function MortgageCalculator({ price, currency = "USD" }) {
  const [expanded, setExpanded] = useState(false);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [termYears, setTermYears] = useState(20);
  const [bankIndex, setBankIndex] = useState(1);
  const [customRate, setCustomRate] = useState(16);
  const [showCurrency, setShowCurrency] = useState("DOP");

  const selectedBank = DR_BANKS[bankIndex];
  const annualRate = selectedBank.rate ?? customRate;

  // Convertir todo a DOP para el cálculo base (las tasas DR son para préstamos en DOP)
  const priceDOP = currency === "DOP" ? price : price * USD_TO_DOP_RATE;
  const downPaymentDOP = (priceDOP * downPaymentPct) / 100;
  const loanDOP = priceDOP - downPaymentDOP;

  const monthlyDOP = useMemo(
    () => calcMonthlyPayment(loanDOP, annualRate, termYears),
    [loanDOP, annualRate, termYears]
  );
  const totalPaidDOP = monthlyDOP * termYears * 12;
  const totalInterestDOP = totalPaidDOP - loanDOP;

  // Equivalente en USD
  const monthlyUSD = monthlyDOP / USD_TO_DOP_RATE;
  const totalPaidUSD = totalPaidDOP / USD_TO_DOP_RATE;
  const totalInterestUSD = totalInterestDOP / USD_TO_DOP_RATE;

  // Mostrar en la moneda seleccionada
  const monthly = showCurrency === "DOP" ? monthlyDOP : monthlyUSD;
  const totalPaid = showCurrency === "DOP" ? totalPaidDOP : totalPaidUSD;
  const totalInterest = showCurrency === "DOP" ? totalInterestDOP : totalInterestUSD;
  const equivalent = showCurrency === "DOP" ? monthlyUSD : monthlyDOP;
  const equivCurrency = showCurrency === "DOP" ? "USD" : "DOP";

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-white">
          <Calculator size={16} strokeWidth={2.25} className="text-blue-600 dark:text-blue-400" />
          Calculadora de hipoteca
        </span>
        {expanded ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Toggle moneda */}
          <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowCurrency("DOP")}
              className={`flex-1 py-2 text-xs font-bold transition-colors ${
                showCurrency === "DOP"
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              RD$ Pesos
            </button>
            <button
              onClick={() => setShowCurrency("USD")}
              className={`flex-1 py-2 text-xs font-bold transition-colors ${
                showCurrency === "USD"
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              US$ Dólares
            </button>
          </div>

          {/* Banco selector */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
              Banco / Tasa
            </label>
            <div className="relative">
              <select
                value={bankIndex}
                onChange={(e) => setBankIndex(Number(e.target.value))}
                className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white pr-8 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DR_BANKS.map((b, i) => (
                  <option key={i} value={i}>
                    {b.name}{b.rate != null ? ` — ${b.rate}% anual` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Tasa personalizada */}
          {selectedBank.rate == null && (
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
                Tasa anual (%)
              </label>
              <input
                type="number"
                min="1"
                max="40"
                step="0.5"
                value={customRate}
                onChange={(e) => setCustomRate(Number(e.target.value))}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Enganche */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Enganche
              </label>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {downPaymentPct}% — {formatPrice(downPaymentDOP, "DOP")}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={downPaymentPct}
              onChange={(e) => setDownPaymentPct(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>0%</span>
              <span>80%</span>
            </div>
          </div>

          {/* Plazo */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Plazo
              </label>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {termYears} años ({termYears * 12} meses)
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={termYears}
              onChange={(e) => setTermYears(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>5 años</span>
              <span>30 años</span>
            </div>
          </div>

          {/* Resultados */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-600 p-4 space-y-3">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Cuota mensual estimada
              </p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {formatPrice(monthly, showCurrency)}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                ≈ {formatPrice(equivalent, equivCurrency)}
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">
                  Préstamo
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatPrice(loanDOP, "DOP")}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">
                  Total a pagar
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatPrice(totalPaid, showCurrency)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">
                  Total intereses
                </p>
                <p className="text-sm font-bold text-red-500 dark:text-red-400">
                  {formatPrice(totalInterest, showCurrency)}
                </p>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed text-center">
            *Simulación orientativa. Tasas de bancos dominicanos para préstamos en DOP. Las condiciones reales pueden variar según perfil crediticio.
          </p>
        </div>
      )}
    </div>
  );
}
