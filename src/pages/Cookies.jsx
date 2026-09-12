import React from "react";
import LegalPageLayout, { Section } from "../components/LegalPageLayout";

const SECTIONS = [
  { id: "resumen",     label: "1. Resumen" },
  { id: "almacenamos", label: "2. Qué guardamos en tu navegador" },
  { id: "terceros",    label: "3. Cookies de terceros" },
  { id: "control",     label: "4. Cómo borrar estos datos" },
  { id: "cambios",     label: "5. Cambios a esta política" },
];

export default function Cookies() {
  return (
    <LegalPageLayout title="Política de cookies" updatedAt="27 de julio de 2026" sections={SECTIONS} path="/cookies">
      <Section id="resumen" title="1. Resumen">
        <p>
          A diferencia de muchos sitios, Domify no usa cookies para mantener tu sesión iniciada.
          Usamos el <strong>almacenamiento local de tu navegador</strong> (<code>localStorage</code>),
          que es similar en propósito a una cookie pero funciona distinto: solo tu navegador puede
          leerlo, no se envía automáticamente en cada petición al servidor, y no lo compartimos con
          nadie.
        </p>
      </Section>

      <Section id="almacenamos" title="2. Qué guardamos en tu navegador">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Token de sesión:</strong> te mantiene identificado para que no tengas que iniciar sesión en cada visita.</li>
          <li><strong>Datos básicos de tu cuenta</strong> (nombre, correo, rol), para mostrar tu perfil sin esperar al servidor.</li>
          <li><strong>Tu lista de favoritos</strong>, para que cargue rápido al volver al sitio.</li>
          <li><strong>Tu preferencia de modo oscuro / claro.</strong></li>
        </ul>
        <p>
          Nada de esto se comparte con terceros ni se usa con fines publicitarios.
        </p>
      </Section>

      <Section id="terceros" title="3. Cookies de terceros">
        <p>
          Usamos <strong>Google Analytics</strong> para entender cómo se usa el sitio (qué páginas se
          visitan, desde qué ciudad o dispositivo, cuánto tiempo se navega) y así poder mejorarlo.
          Google Analytics sí usa cookies propias para esto. No usamos cookies de publicidad ni
          compartimos tus datos personales (nombre, correo) con Google — solo datos de navegación
          anónimos y agregados.
        </p>
        <p>
          Puedes bloquear estas cookies desde la configuración de tu navegador, o instalando el{" "}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
          >
            complemento de inhabilitación de Google Analytics
          </a>
          , sin que eso afecte tu uso normal del sitio.
        </p>
      </Section>

      <Section id="control" title="4. Cómo borrar estos datos">
        <p>
          Puedes borrar todo lo anterior en cualquier momento:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Cerrando sesión desde el menú de tu cuenta — esto borra tu token y tus datos guardados.</li>
          <li>Borrando los datos de sitio de tu navegador (en Chrome: Configuración → Privacidad y seguridad → Borrar datos de navegación).</li>
        </ul>
      </Section>

      <Section id="cambios" title="5. Cambios a esta política">
        <p>
          Si empezamos a usar cookies o almacenamiento adicional con fines distintos a los descritos
          aquí, actualizaremos esta página y, si aplica, te lo notificaremos en el sitio.
        </p>
      </Section>
    </LegalPageLayout>
  );
}
