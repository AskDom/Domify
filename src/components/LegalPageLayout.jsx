import React, { useEffect, useRef, useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Seo from "./Seo";

export function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">{title}</h2>
      <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

export default function LegalPageLayout({ title, updatedAt, sections, children, path }) {
  const [activeId, setActiveId] = useState(sections?.[0]?.id);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!sections?.length) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [sections]);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
      {path && <Seo title={title} description={`${title} de Domify, el portal inmobiliario dominicano.`} path={path} />}
      <Navbar />

      <div className="flex-1 px-4 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">

          {/* ÍNDICE — sticky, solo desktop */}
          {sections?.length > 0 && (
            <nav className="hidden lg:block sticky top-24 self-start">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 px-3">
                Contenido
              </p>
              <ul className="space-y-0.5">
                {sections.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => scrollToSection(s.id)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all ${
                        activeId === s.id
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* CONTENIDO */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 md:p-12 min-w-0">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">{title}</h1>
            <p className="text-gray-400 text-xs mt-1">Última actualización: {updatedAt}</p>

            <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 text-sm leading-relaxed">
              ⚠️ Este documento es una plantilla de referencia y no constituye asesoría legal.
              Antes de publicarlo, hazlo revisar por un abogado familiarizado con la Ley 172-13 sobre
              Protección de Datos de Carácter Personal de la República Dominicana.
            </div>

            <div className="mt-8 space-y-8">
              {children}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
