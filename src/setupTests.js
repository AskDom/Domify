// jest-dom (compatible con Vitest) agrega matchers para asegurar sobre
// nodos del DOM, como expect(element).toHaveTextContent(/react/i).
// https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Node 26 trae un localStorage nativo experimental que se define como
// global ANTES que jsdom arranque su entorno — jsdom ve que la propiedad ya
// existe y no la pisa con su propia implementación, pero el getter nativo
// de Node devuelve undefined si no se le pasa --localstorage-file por CLI
// ("ExperimentalWarning: localStorage is not available..."). El resultado
// es que tanto `localStorage` como `window.localStorage` quedan undefined
// en los tests, aunque en un navegador real (o en la app corriendo con
// Vite) sí existen. Se pisa acá con un polyfill en memoria — confirmado
// que la propiedad es "configurable", así que la reasignación directa
// funciona sin pelear con el getter/setter nativo.
function createMemoryStorage() {
  let store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

global.localStorage = createMemoryStorage();
global.sessionStorage = createMemoryStorage();
window.localStorage = global.localStorage;
window.sessionStorage = global.sessionStorage;

// jsdom (el entorno de test) no trae TextEncoder/TextDecoder — react-router
// los usa internamente y sin esto ni siquiera se puede importar. Es una
// limitación de jsdom, no de Jest ni de Vitest en particular.
import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;

// jsdom tampoco implementa IntersectionObserver (usado por el scroll-spy
// de las páginas legales, entre otros) — un stub sin comportamiento real
// alcanza para que los componentes que lo usan no revienten en los tests.
if (typeof global.IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom no implementa window.scrollTo — framer-motion lo llama desde un
// animation frame que a veces sigue corriendo después de que el test
// terminó, y sin este stub ensucia la consola con un error de "Not
// implemented" que no tiene nada que ver con el test en sí.
window.scrollTo = () => {};

// InboxContext/NotificationsContext abren un socket.io real apenas hay
// currentUser — sin mockearlo, cualquier test con sesión iniciada dispara
// una conexión de red real (a un backend que no existe en el entorno de
// test) y dejaría handles abiertos colgando después de cada test.
vi.mock('socket.io-client', () => ({
  io: () => ({ on: vi.fn(), off: vi.fn(), emit: vi.fn(), disconnect: vi.fn() }),
}));
