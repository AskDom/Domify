import React from "react";
import { Link } from "react-router-dom";
import LegalPageLayout, { Section } from "../components/LegalPageLayout";

const SECTIONS = [
  { id: "datos",        label: "1. Qué datos recopilamos" },
  { id: "uso",          label: "2. Cómo los usamos" },
  { id: "terceros",     label: "3. Con quién los compartimos" },
  { id: "seguridad",    label: "4. Seguridad" },
  { id: "retencion",    label: "5. Retención de datos" },
  { id: "derechos",     label: "6. Tus derechos" },
  { id: "menores",      label: "7. Menores de edad" },
  { id: "cambios",      label: "8. Cambios a esta política" },
  { id: "contacto",     label: "9. Contacto" },
];

export default function Privacidad() {
  return (
    <LegalPageLayout title="Política de privacidad" updatedAt="27 de julio de 2026" sections={SECTIONS} path="/privacidad">
      <Section id="datos" title="1. Qué datos recopilamos">
        <p>Cuando usas Domify podemos recopilar:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Datos de cuenta:</strong> nombre, correo electrónico y contraseña (almacenada de forma cifrada, nunca en texto plano).</li>
          <li><strong>Foto de perfil</strong>, si decides subir una.</li>
          <li><strong>Propiedades que publicas:</strong> título, descripción, precio, ubicación (latitud/longitud), fotos y características.</li>
          <li><strong>Actividad en el sitio:</strong> favoritos, búsquedas guardadas, reseñas que escribes, mensajes que envías a otros usuarios sobre propiedades.</li>
          <li><strong>Datos técnicos básicos</strong> necesarios para mantener tu sesión iniciada.</li>
        </ul>
      </Section>

      <Section id="uso" title="2. Cómo los usamos">
        <ul className="list-disc pl-5 space-y-1">
          <li>Para crear y mantener tu cuenta, y mantenerte identificado entre visitas.</li>
          <li>Para mostrar tus propiedades publicadas y tu perfil público (si publicas como vendedor o agente).</li>
          <li>Para permitir la mensajería directa con otros usuarios sobre una propiedad.</li>
          <li>Para enviarte notificaciones cuando algo coincide con una búsqueda guardada tuya.</li>
          <li>Para enviarte un correo si solicitas restablecer tu contraseña.</li>
        </ul>
      </Section>

      <Section id="terceros" title="3. Con quién los compartimos">
        <p>No vendemos tus datos. Usamos estos proveedores para operar el Servicio:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Cloudinary</strong> — almacenamiento de las fotos que subes (propiedades y foto de perfil).</li>
          <li><strong>Resend</strong> — envío del correo de recuperación de contraseña.</li>
          <li><strong>Google Analytics</strong> — estadísticas de uso del sitio (páginas visitadas, ciudad, dispositivo), de forma anónima y agregada. Ver detalle en nuestra <Link to="/cookies">política de cookies</Link>.</li>
        </ul>
        <p>
          Tu nombre, foto y las propiedades que publicas son visibles públicamente para cualquier
          visitante del sitio, ya que ese es el propósito del Servicio. Tu correo electrónico nunca
          se muestra públicamente.
        </p>
      </Section>

      <Section id="seguridad" title="4. Seguridad">
        <p>
          Tu contraseña se guarda cifrada (nunca en texto plano). El acceso a tu cuenta se controla
          con un token de sesión, y limitamos los intentos de inicio de sesión para dificultar
          ataques de fuerza bruta. Ningún sistema es 100% seguro, así que te recomendamos usar una
          contraseña única para Domify.
        </p>
        <p>
          El token de sesión se guarda en el almacenamiento local de tu navegador
          (<code>localStorage</code>), no en cookies — más detalle en nuestra{" "}
          <Link to="/cookies">política de cookies</Link>.
        </p>
      </Section>

      <Section id="retencion" title="5. Retención de datos">
        <p>
          Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, eliminamos o
          anonimizamos tus datos personales, salvo la información que debamos conservar por
          obligación legal.
        </p>
      </Section>

      <Section id="derechos" title="6. Tus derechos">
        <p>
          Bajo la Ley 172-13 sobre Protección de Datos de Carácter Personal de la República
          Dominicana, tienes derecho a acceder, rectificar, cancelar y oponerte al tratamiento de tus
          datos personales. Puedes ejercer estos derechos:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Editando tu nombre y foto directamente desde <em>Mi perfil</em>.</li>
          <li>Eliminando propiedades, reseñas o búsquedas guardadas que hayas creado.</li>
          <li>Solicitando la eliminación completa de tu cuenta contactándonos (ver sección 9).</li>
        </ul>
      </Section>

      <Section id="menores" title="7. Menores de edad">
        <p>
          El Servicio no está dirigido a menores de 18 años. No solicitamos ni recopilamos a
          sabiendas datos de menores de edad.
        </p>
      </Section>

      <Section id="cambios" title="8. Cambios a esta política">
        <p>
          Podemos actualizar esta política ocasionalmente. Si el cambio es significativo, lo
          anunciaremos en el sitio antes de que entre en vigor.
        </p>
      </Section>

      <Section id="contacto" title="9. Contacto">
        <p>
          Para ejercer tus derechos o hacer preguntas sobre esta política, escríbenos a{" "}
          <a href="mailto:privacidad@domify.com">privacidad@domify.com</a>{" "}
          <span className="text-xs text-gray-400">(correo de ejemplo — reemplázalo por el real)</span>.
        </p>
      </Section>
    </LegalPageLayout>
  );
}
