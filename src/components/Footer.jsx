import React from "react";
import { Link } from "react-router-dom";

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="9" x2="6" y2="17"/>
    <circle cx="6" cy="5.5" r="0.75" fill="currentColor" stroke="none"/>
    <path d="M11 17v-5.5c0-1.5 1-2.5 2.5-2.5S16 10 16 11.5V17"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.5 8.5h2.2V5.3h-2.2c-2.4 0-4.3 1.9-4.3 4.3v1.9H8v3.2h2.2V21h3.2v-6.3h2.4l.5-3.2h-2.9V9.6c0-.6.5-1.1 1.1-1.1Z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="4.5"/>
    <circle cx="12" cy="12" r="3.6"/>
    <circle cx="16.8" cy="7.2" r="0.6" fill="currentColor" stroke="none"/>
  </svg>
);

const LINKS = {
  Explorar: [
    { label: "Inicio", to: "/" },
    { label: "Comprar", to: "/search?q=República Dominicana" },
    { label: "Rentar", to: "/search?q=República Dominicana" },
    { label: "Publicar propiedad", to: "/publish" },
  ],
  "Mi cuenta": [
    { label: "Mi perfil", to: "/profile" },
    { label: "Mis favoritos", to: "/favorites" },
    { label: "Inbox", to: "/inbox" },
    { label: "Mis propiedades", to: "/profile?tab=propiedades" },
  ],
  Ciudades: [
    { label: "Santo Domingo", to: "/search?q=Santo Domingo" },
    { label: "Santiago", to: "/search?q=Santiago" },
    { label: "Punta Cana", to: "/search?q=Punta Cana" },
    { label: "Samaná", to: "/search?q=Samaná" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300 mt-16">
      {/* MAIN FOOTER */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* BRAND */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src="/logo192.png" alt="Domify" className="block dark:hidden w-10 h-10 rounded-2xl shadow-md object-contain" />
              <img src="/logo192-dark.png" alt="Domify" className="hidden dark:block w-10 h-10 rounded-2xl shadow-md object-contain" />

              <div>
                <h2 className="font-black text-xl leading-none text-gray-900 dark:text-white">
                  Domify
                </h2>
                <p className="text-xs text-gray-400">Real Estate</p>
              </div>
            </Link>

            <p className="text-gray-500 dark:text-gray-400 text-sm leading-6 max-w-xs">
              La plataforma líder de bienes raíces en República Dominicana.
              Encuentra tu hogar ideal entre miles de propiedades.
            </p>

            {/* REDES SOCIALES */}
            <div className="flex gap-3 mt-5">
              {[
                { Icon: XIcon,         href: "https://x.com",         label: "X" },
                { Icon: LinkedInIcon,  href: "https://linkedin.com",  label: "LinkedIn" },
                { Icon: FacebookIcon,  href: "https://facebook.com",  label: "Facebook" },
                { Icon: InstagramIcon, href: "https://instagram.com", label: "Instagram" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="bg-gray-100 dark:bg-gray-800 hover:bg-blue-600 hover:text-white text-gray-600 dark:text-gray-400 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                >
                  <social.Icon />
                </a>
              ))}
            </div>
          </div>

          {/* COLUMNAS */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="font-black text-gray-900 dark:text-white text-sm mb-4 uppercase tracking-wider">
                {section}
              </h3>

              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-gray-100 dark:border-gray-800 transition-colors">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
          <p>
            © {new Date().getFullYear()} Domify. Todos los derechos reservados.
          </p>

          <div className="flex gap-5">
            <Link to="/terminos" className="hover:text-blue-500 transition">
              Términos de uso
            </Link>

            <Link to="/privacidad" className="hover:text-blue-500 transition">
              Privacidad
            </Link>

            <Link to="/cookies" className="hover:text-blue-500 transition">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}