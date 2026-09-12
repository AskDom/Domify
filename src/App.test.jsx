import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

// PropertiesProvider pide /api/properties apenas monta (sin importar la
// ruta, porque envuelve toda la app), y AuthContext siempre valida la
// sesión contra /api/auth/me — sin esto la app entera no puede montarse
// en el test.
function mockFetch() {
  global.fetch = vi.fn((url) => {
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
    }
    if (url.includes('/api/properties')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ properties: [] }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

beforeEach(() => {
  mockFetch();
  window.history.pushState({}, '', '/terminos');
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('monta la app completa (providers + router) sin crashear y navega a una ruta real', async () => {
  render(<App />);

  // Navbar — confirma que ThemeProvider/AuthProvider/etc. no rompen el render
  const logos = await screen.findAllByAltText('Domify');
  expect(logos.length).toBeGreaterThan(0);
  expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();

  // Contenido de la ruta /terminos — confirma que el router está sirviendo
  // la página correcta, no solo el shell. Por nombre de rol, no de texto:
  // el footer también linkea a "Términos de uso".
  expect(await screen.findByRole('heading', { name: 'Términos de uso' })).toBeInTheDocument();
});
