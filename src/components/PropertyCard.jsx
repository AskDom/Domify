import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bed, Bath, Car, MapPin, Heart } from "lucide-react";
import PropertyImage from "./PropertyImage";
import VerifiedBadge from "./VerifiedBadge";
import PriceTag from "./PriceTag";
import { formatLocation } from "../utils/formatLocation";

export default function PropertyCard({ prop, index = 0, toggleFavorite, isFavorite, toast }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <Link to={`/property/${prop.id}`} onClick={() => window.scrollTo(0, 0)}>
        <div className="group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 h-full flex flex-col"
          style={{
            boxShadow: hovered
              ? "0 20px 60px -10px rgba(0,0,0,0.18)"
              : "0 2px 12px rgba(0,0,0,0.07)",
            transform: hovered ? "translateY(-4px)" : "translateY(0)",
            transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* Imagen */}
          <div className="relative overflow-hidden" style={{ height: 200 }}>
            <PropertyImage
              src={prop.image}
              type={prop.type}
              alt={prop.title}
              className="w-full h-full object-cover"
              style={{
                transform: hovered ? "scale(1.07)" : "scale(1)",
                transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
              }}
            />

            {/* Gradiente inferior */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"/>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-1.5 items-center">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-md ${
                prop.status === "Venta" ? "bg-blue-600 text-white" : "bg-emerald-500 text-white"
              }`}>
                {prop.status}
              </span>
              <span className="bg-white/95 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 px-2.5 py-1 rounded-full text-xs font-semibold shadow">
                {prop.type}
              </span>
              {prop.verified && <VerifiedBadge />}
            </div>

            {/* Favorito */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(prop.id);
                toast?.({
                  message: isFavorite(prop.id) ? "Eliminado de favoritos" : "Guardado en favoritos ❤️",
                  type: isFavorite(prop.id) ? "info" : "success",
                });
              }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: "rgba(255,255,255,0.95)" }}
            >
              <Heart
                size={15}
                strokeWidth={2.25}
                fill={isFavorite(prop.id) ? "currentColor" : "none"}
                className={isFavorite(prop.id) ? "text-red-500" : "text-gray-400"}
              />
            </motion.button>

            {/* Precio flotante */}
            <div className="absolute bottom-3 left-3">
              <div className="bg-white/95 dark:bg-gray-900/90 backdrop-blur rounded-xl px-3 py-1.5 shadow">
                <p className="font-black text-gray-900 dark:text-white text-base leading-none whitespace-nowrap">
                  <PriceTag price={prop.price} currency={prop.currency} />
                  {prop.status === "Renta" && (
                    <span className="text-gray-400 text-[10px] font-medium ml-1">/mes</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 flex flex-col flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
              {prop.title}
            </h3>
            <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
              <MapPin size={12} strokeWidth={2.25} /> {formatLocation(prop.city, prop.sector)}
            </p>

            {/* Amenidades */}
            <div className="flex gap-3 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 text-xs">
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Bed size={14} strokeWidth={2.25} /> {prop.rooms} hab
              </span>
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Bath size={14} strokeWidth={2.25} /> {prop.baths} baños
              </span>
              {prop.parking > 0 && (
                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <Car size={14} strokeWidth={2.25} /> {prop.parking}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
