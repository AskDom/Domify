import React from "react";
import LegalPageLayout, { Section } from "../components/LegalPageLayout";

const SECTIONS = [
  { id: "aceptacion",    label: "1. Aceptación" },
  { id: "servicio",      label: "2. Descripción del servicio" },
  { id: "cuentas",       label: "3. Cuentas y roles" },
  { id: "contenido",     label: "4. Contenido publicado" },
  { id: "conducta",      label: "5. Conducta prohibida" },
  { id: "propiedad",     label: "6. Propiedad intelectual" },
  { id: "responsabilidad", label: "7. Limitación de responsabilidad" },
  { id: "terminacion",   label: "8. Terminación de cuenta" },
  { id: "cambios",       label: "9. Cambios a estos términos" },
  { id: "ley",           label: "10. Ley aplicable" },
  { id: "contacto",      label: "11. Contacto" },
];

export default function Terminos() {
  return (
    <LegalPageLayout title="Términos de uso" updatedAt="24 de julio de 2026" sections={SECTIONS} path="/terminos">
      <Section id="aceptacion" title="1. Aceptación">
        <p>
          Al crear una cuenta o usar Domify (el "Servicio") aceptas estos Términos de uso. Si no
          estás de acuerdo con alguna parte, no debes usar el Servicio.
        </p>
      </Section>

      <Section id="servicio" title="2. Descripción del servicio">
        <p>
          Domify es un portal para publicar, buscar y gestionar propiedades en venta o alquiler en
          República Dominicana. Conectamos a personas que publican propiedades (vendedores y
          agentes) con personas interesadas en comprarlas o rentarlas, mediante búsqueda, mensajería
          directa entre usuarios y reseñas.
        </p>
      </Section>

      <Section id="cuentas" title="3. Cuentas y roles">
        <p>Al registrarte eliges un tipo de cuenta:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Cliente:</strong> puede buscar propiedades, guardar favoritos, guardar búsquedas y contactar a quien publica.</li>
          <li><strong>Vendedor / Agente:</strong> además de lo anterior, puede publicar propiedades.</li>
        </ul>
        <p>
          Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad que
          ocurra en tu cuenta. Debes darnos información veraz al registrarte.
        </p>
      </Section>

      <Section id="contenido" title="4. Contenido publicado por usuarios">
        <p>
          Al publicar una propiedad, foto, mensaje o reseña, declaras que tienes derecho a
          compartirla y que la información es veraz. Domify no verifica de forma independiente
          cada anuncio publicado; la insignia de "verificado" que puede mostrarse en algunas
          propiedades no constituye garantía de titularidad, estado legal ni exactitud de los datos
          de la propiedad.
        </p>
        <p>
          Eres el único responsable del contenido que publicas. Nos reservas una licencia limitada
          para mostrar ese contenido dentro del Servicio (por ejemplo, en resultados de búsqueda y
          en tu perfil público).
        </p>
      </Section>

      <Section id="conducta" title="5. Conducta prohibida">
        <ul className="list-disc pl-5 space-y-1">
          <li>Publicar propiedades falsas, engañosas o que no tienes derecho a ofrecer.</li>
          <li>Usar la mensajería del sitio para spam, acoso o fines distintos a consultas sobre propiedades.</li>
          <li>Intentar acceder a cuentas, propiedades o datos de otros usuarios sin autorización.</li>
          <li>Publicar reseñas falsas o manipular calificaciones.</li>
          <li>Usar el Servicio para actividades ilegales bajo la ley dominicana.</li>
        </ul>
      </Section>

      <Section id="propiedad" title="6. Propiedad intelectual">
        <p>
          La marca Domify, el diseño y el software del Servicio nos pertenecen. El contenido que tú
          subes (fotos de propiedades, descripciones, tu foto de perfil) sigue siendo tuyo.
        </p>
      </Section>

      <Section id="responsabilidad" title="7. Limitación de responsabilidad">
        <p>
          Domify es un intermediario tecnológico: no somos parte de las negociaciones, contratos de
          compraventa o alquiler entre usuarios, y no garantizamos la exactitud de los anuncios ni la
          idoneidad de ningún usuario como contraparte. Cualquier transacción entre usuarios corre
          por cuenta y riesgo de ambas partes. Te recomendamos verificar la titularidad y el estado
          legal de cualquier propiedad antes de una transacción.
        </p>
      </Section>

      <Section id="terminacion" title="8. Terminación de cuenta">
        <p>
          Puedes eliminar tu cuenta cuando quieras contactándonos. Podemos suspender o cerrar cuentas
          que incumplan estos términos, sin perjuicio de otras acciones que correspondan.
        </p>
      </Section>

      <Section id="cambios" title="9. Cambios a estos términos">
        <p>
          Podemos actualizar estos términos ocasionalmente. Si el cambio es significativo, lo
          anunciaremos en el sitio. El uso continuado del Servicio después de un cambio implica su
          aceptación.
        </p>
      </Section>

      <Section id="ley" title="10. Ley aplicable">
        <p>
          Estos términos se rigen por las leyes de la República Dominicana. Cualquier disputa se
          someterá a los tribunales competentes de la República Dominicana.
        </p>
      </Section>

      <Section id="contacto" title="11. Contacto">
        <p>
          Para preguntas sobre estos términos, escríbenos a{" "}
          <a href="mailto:soporte@domify.com">soporte@domify.com</a>{" "}
          <span className="text-xs text-gray-400">(correo de ejemplo — reemplázalo por el real)</span>.
        </p>
      </Section>
    </LegalPageLayout>
  );
}
