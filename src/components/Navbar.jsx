import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Building2, Heart as HeartLucide, Mail, LogOut, ChevronDown, Bell as BellLucide, Home as HomeLucide, ShieldCheck, Plus, CheckCheck } from "lucide-react";
import AuthModal from "./AuthModal";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useProperties } from "../context/PropertiesContext";
import { useInbox } from "../context/InboxContext";
import { useNotifications } from "../context/NotificationsContext";

// SVG Icons
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const InboxIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const ROLE_CONFIG = {
  Agente:   { label: "Agente",   emoji: "⭐",  bg: "from-amber-500 to-orange-500" },
  Vendedor: { label: "Vendedor", emoji: "🏠",  bg: "from-emerald-500 to-green-600" },
  Admin:    { label: "Admin",    emoji: "🛡️", bg: "from-purple-500 to-fuchsia-600" },
  Cliente:  { label: "Cliente",  emoji: "👤",  bg: "from-blue-500 to-sky-500" },
};

export default function Navbar() {
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const { dark, toggleDark } = useTheme();
  const { currentUser, logout } = useAuth();
    const { favorites } = useProperties();
  const { getUnreadCount } = useInbox();
  const { notifications, unreadCount: unreadNotifs, markAsRead, markAllAsRead } = useNotifications();
  const unread = currentUser ? getUnreadCount(currentUser.id) : 0;
  const roleConfig = ROLE_CONFIG[currentUser?.role] || ROLE_CONFIG.Cliente;

  const iconBtn = "relative flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200";

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (notifOpen) setNotifOpen(false);
        if (userMenuOpen) setUserMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [notifOpen, userMenuOpen]);

  return (
    <>
      <nav aria-label="Navegación principal" className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700 shadow-md transition-colors duration-300">
        <div className="max-w-screen-2xl mx-auto px-5 py-3 flex items-center gap-4">

          {/* LOGO — anclado a la izquierda */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 mr-auto">
            <img src="/logo192.png" alt="Domify" className="block dark:hidden w-9 h-9 rounded-xl shadow-md object-contain" />
            <img src="/logo192-dark.png" alt="Domify" className="hidden dark:block w-9 h-9 rounded-xl shadow-md object-contain" />
            <div className="leading-none">
              <p className="font-black text-lg text-gray-900 dark:text-white tracking-tight">Domify</p>
              <p className="text-[10px] text-gray-400 font-medium">Real Estate</p>
            </div>
          </Link>

          {/* ICONOS — agrupados limpiamente */}
          <div className="flex items-center gap-1">

            {/* DARK MODE */}
            <button onClick={toggleDark} className={iconBtn} title={dark ? "Modo claro" : "Modo oscuro"} aria-label={dark ? "Modo claro" : "Modo oscuro"}>
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* INBOX */}
            {currentUser && (
              <Link to="/inbox" className={iconBtn} aria-label="Bandeja de entrada">
                <InboxIcon />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {unread}
                  </span>
                )}
              </Link>
            )}

            {/* NOTIFICACIONES */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className={iconBtn}
                  aria-label="Notificaciones"
                  aria-expanded={notifOpen}
                  aria-haspopup="true"
                >
                  <BellIcon />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-80 max-w-[90vw] origin-top-right bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-100 dark:border-gray-700/80 rounded-3xl shadow-2xl shadow-gray-900/10 dark:shadow-black/40 overflow-hidden z-50"
                      >
                        <div className="px-4 py-3.5 bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-white">
                            <BellLucide size={15} strokeWidth={2.25} />
                            <p className="text-sm font-black">Notificaciones</p>
                          </span>
                          {unreadNotifs > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="flex items-center gap-1 text-[11px] text-white/90 font-semibold bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full transition-colors"
                            >
                              <CheckCheck size={12} strokeWidth={2.5} /> Marcar leídas
                            </button>
                          )}
                        </div>
                        <div className="max-h-96 overflow-y-auto p-1.5">
                          {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10">
                              <div className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-gray-700/60 flex items-center justify-center mb-2.5">
                                <BellLucide size={18} strokeWidth={2} className="text-gray-300 dark:text-gray-500" />
                              </div>
                              <p className="text-gray-400 text-sm">No tienes notificaciones</p>
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <Link
                                key={n.id}
                                to={n.propertyId ? `/property/${n.propertyId}` : "#"}
                                onClick={() => { markAsRead(n.id); setNotifOpen(false); }}
                                className={`flex items-start gap-3 px-2.5 py-2.5 rounded-2xl text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/60 ${
                                  n.read ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white font-semibold"
                                }`}
                              >
                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                  n.read
                                    ? "bg-gray-50 dark:bg-gray-700/60 text-gray-300 dark:text-gray-500"
                                    : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                }`}>
                                  <BellLucide size={14} strokeWidth={2.25} />
                                </span>
                                <span className="flex-1 leading-snug pt-1">{n.message}</span>
                                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2.5 flex-shrink-0" />}
                              </Link>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* FAVORITOS */}
            <Link to="/favorites" className={`${iconBtn} ${favorites.length > 0 ? "text-red-500 dark:text-red-400" : ""}`} aria-label="Favoritos">
              <HeartIcon filled={favorites.length > 0} />
              {favorites.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {favorites.length}
                </span>
              )}
            </Link>

          </div>

          {/* SEPARADOR */}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

          {/* PUBLICAR */}
          {(!currentUser || ["Agente", "Vendedor"].includes(currentUser.role)) && (
            <Link to="/publish" className="hidden md:block">
              <button className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 ${
                location.pathname === "/publish"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              }`}>
                + Publicar
              </button>
            </Link>
          )}

          {/* PANEL ADMIN — visible directo, fuera del menú desplegable */}
          {currentUser?.role === "Admin" && (
            <Link
              to="/admin"
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                location.pathname === "/admin"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50"
              }`}
            >
              🛡️ Admin
            </Link>
          )}

          {/* USER / SIGN IN */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <div className={`p-[2px] rounded-xl bg-gradient-to-br ${roleConfig.bg} shadow-sm`}>
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-7 h-7 rounded-[9px] object-cover block" />
                  ) : (
                    <div className="w-7 h-7 rounded-[9px] bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center font-black text-sm">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="hidden md:block text-left leading-none">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{currentUser.name.split(" ")[0]}</p>
                  <p className={`text-[10px] font-semibold bg-gradient-to-r ${roleConfig.bg} bg-clip-text text-transparent`}>
                    {roleConfig.emoji} {roleConfig.label}
                  </p>
                </div>
                <ChevronDown
                  size={14}
                  strokeWidth={2.5}
                  className={`hidden md:block text-gray-400 ml-0.5 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* DROPDOWN */}
              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-3 w-64 origin-top-right bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-100 dark:border-gray-700/80 rounded-3xl shadow-2xl shadow-gray-900/10 dark:shadow-black/40 overflow-hidden z-50"
                    >
                      {/* HEADER */}
                      <div className={`relative overflow-hidden px-5 py-4 bg-gradient-to-br ${roleConfig.bg}`}>
                        <div className="absolute -top-8 -right-6 w-24 h-24 bg-white/15 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative flex items-center gap-3">
                          {currentUser.avatar ? (
                            <img src={currentUser.avatar} alt={currentUser.name} className="w-11 h-11 rounded-2xl object-cover ring-2 ring-white/40 shadow-lg flex-shrink-0" />
                          ) : (
                            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur ring-2 ring-white/40 text-white flex items-center justify-center font-black text-lg shadow-lg flex-shrink-0">
                              {currentUser.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                           <div className="min-w-0">
                             <p className="text-sm font-black text-white truncate">{currentUser.name}</p>
                             <p className="text-[11px] text-white/75 truncate">{currentUser.email}</p>
                           </div>
                         </div>
                         <span className="relative inline-flex items-center gap-1 mt-3 bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                           {roleConfig.emoji} {roleConfig.label}
                         </span>
                       </div>

                      {/* ITEMS */}
                      <div className="p-1.5">
                        {[
                          { to: "/profile", label: "Mi perfil", Icon: User, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400" },
                          { to: "/profile?tab=propiedades", label: "Mis propiedades", Icon: Building2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400" },
                          { to: "/favorites", label: "Favoritos", Icon: HeartLucide, color: "text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400" },
                          { to: "/inbox", label: "Inbox", Icon: Mail, color: "text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400", badge: unread },
                        ].map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setUserMenuOpen(false)}
                            className="group flex items-center justify-between px-2.5 py-2 rounded-2xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
                          >
                            <span className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${item.color}`}>
                                <item.Icon size={15} strokeWidth={2.25} />
                              </span>
                              <span className="font-semibold">{item.label}</span>
                            </span>
                            {item.badge > 0 && (
                              <span className="bg-red-500 text-white text-[11px] min-w-[18px] text-center px-1.5 py-0.5 rounded-full font-bold">{item.badge}</span>
                            )}
                          </Link>
                        ))}
                      </div>

                      <div className="border-t border-gray-100 dark:border-gray-700/70 p-1.5">
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          aria-label="Cerrar sesión"
                        >
                          <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-500">
                            <LogOut size={15} strokeWidth={2.25} />
                          </span>
                          Cerrar sesión
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl hover:opacity-80 transition"
            >
              Iniciar sesión
            </button>
          )}

          {/* MOBILE TOGGLE */}
          <button
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* MOBILE MENU */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="lg:hidden border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden"
            >
              <div className="px-4 py-3 flex flex-col gap-1">
                {currentUser && (
                  <div className={`relative overflow-hidden flex items-center gap-3 px-4 py-3.5 mb-1.5 rounded-2xl bg-gradient-to-br ${roleConfig.bg}`}>
                    <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/15 rounded-full blur-2xl pointer-events-none" />
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="relative w-10 h-10 rounded-2xl object-cover ring-2 ring-white/40 shadow-lg flex-shrink-0" />
                    ) : (
                      <div className="relative w-10 h-10 rounded-2xl bg-white/20 backdrop-blur ring-2 ring-white/40 text-white flex items-center justify-center font-black shadow-lg flex-shrink-0">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="relative min-w-0">
                      <p className="text-sm font-black text-white truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-white/80 font-semibold">{roleConfig.emoji} {roleConfig.label}</p>
                    </div>
                  </div>
                )}

                {[
                  { to: "/", label: "Inicio", Icon: HomeLucide, color: "text-gray-600 bg-gray-100 dark:bg-gray-700/60 dark:text-gray-300" },
                  ...(currentUser ? [
                    { to: "/profile", label: "Mi perfil", Icon: User, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400" },
                    { to: "/profile?tab=propiedades", label: "Mis propiedades", Icon: Building2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400" },
                    { to: "/inbox", label: "Inbox", Icon: Mail, color: "text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400", badge: unread },
                  ] : []),
                  { to: "/favorites", label: "Favoritos", Icon: HeartLucide, color: "text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400", badge: favorites.length },
                  ...(currentUser?.role === "Admin" ? [
                    { to: "/admin", label: "Panel admin", Icon: ShieldCheck, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400" },
                  ] : []),
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-center justify-between px-2.5 py-2.5 rounded-2xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${item.color}`}>
                        <item.Icon size={15} strokeWidth={2.25} />
                      </span>
                      <span className="font-semibold">{item.label}</span>
                    </span>
                    {item.badge > 0 && (
                      <span className="bg-red-500 text-white text-[11px] min-w-[18px] text-center px-1.5 py-0.5 rounded-full font-bold">{item.badge}</span>
                    )}
                  </Link>
                ))}

                {currentUser && (
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="flex items-center gap-3 px-2.5 py-2.5 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-500">
                      <LogOut size={15} strokeWidth={2.25} />
                    </span>
                    Cerrar sesión
                  </button>
                )}

                <Link
                  to="/publish"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1.5 flex items-center justify-center gap-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-3 rounded-2xl font-bold text-sm shadow-md hover:opacity-90 transition"
                >
                  <Plus size={16} strokeWidth={2.5} /> Publicar propiedad
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}