import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    // Ya era el comportamiento buscado con GENERATE_SOURCEMAP=false en CRA
    // (.env.production, ahora eliminado): sin sourcemaps, el código fuente
    // original no queda reconstruible desde el bundle servido en el
    // navegador. Es el default de Vite, pero se deja explícito a propósito.
    sourcemap: false,
  },

  server: {
    // El backend (app.js) tiene "http://localhost:3000" hardcodeado en su
    // allowlist de CORS además de FRONTEND_URL — si Vite arranca en su
    // puerto por defecto (5173), el navegador bloquea todos los fetch al
    // backend local por CORS.
    port: 3000,
  },

  test: {
    environment: "jsdom",
    // Sin una URL de origen, jsdom deshabilita localStorage/sessionStorage
    // — y AuthContext (entre otros) los usa como globals a secas (sin
    // "window."), como en cualquier navegador real.
    environmentOptions: {
      jsdom: { url: "http://localhost:3000", storageQuota: 10_000_000 },
    },
    globals: true,
    setupFiles: "./src/setupTests.js",
    css: true,
  },
});
