import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import SearchResults from './SearchResults';
import { renderWithProviders } from '../testUtils/renderWithProviders';

const baseProperty = {
  currency: 'USD', city: 'Santo Domingo', sector: 'Piantini',
  type: 'APARTAMENTO', status: 'VENTA', rooms: 2, baths: 1, parking: 1,
  lat: 18.47, lng: -69.93, images: [],
};

const PAGE_1 = [
  { ...baseProperty, id: 'p1', title: 'Casa Uno', price: 100000 },
  { ...baseProperty, id: 'p2', title: 'Casa Dos', price: 120000 },
];
const PAGE_2 = [
  { ...baseProperty, id: 'p3', title: 'Casa Tres', price: 130000 },
  { ...baseProperty, id: 'p4', title: 'Casa Cuatro', price: 140000 },
];

// mockApiFetch (testUtils) no expone la URL completa a los handlers, y acá
// necesitamos leer ?page= para simular la paginación real del backend — por
// eso un mock de fetch propio en vez del helper compartido.
function mockPropertiesPaginated() {
  global.fetch = vi.fn((url) => {
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ user: null }) });
    }
    if (url.includes('/api/properties')) {
      const page = new URL(url).searchParams.get('page') || '1';
      const properties = page === '2' ? PAGE_2 : PAGE_1;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          properties,
          pagination: { total: 5, page: Number(page), limit: 50, totalPages: 3, hasMore: true },
        }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ messages: [], notifications: [], favorites: [], properties: [], unreadCount: 0, total: 0 }),
    });
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

test('"Cargar más" suma la página siguiente en vez de reemplazar la lista', async () => {
  mockPropertiesPaginated();
  const user = userEvent.setup();
  renderWithProviders(<SearchResults />, { route: '/search' });

  expect(await screen.findByText('Casa Uno')).toBeInTheDocument();
  expect(await screen.findByText('Casa Dos')).toBeInTheDocument();
  expect(screen.queryByText('Casa Tres')).not.toBeInTheDocument();

  await user.click(await screen.findByRole('button', { name: /Cargar más/i }));

  // Las dos primeras siguen ahí (no se reemplazó la lista) y se sumaron las dos nuevas.
  expect(await screen.findByText('Casa Tres')).toBeInTheDocument();
  expect(await screen.findByText('Casa Cuatro')).toBeInTheDocument();
  expect(screen.getByText('Casa Uno')).toBeInTheDocument();
  expect(screen.getByText('Casa Dos')).toBeInTheDocument();

  // total=5, 4 cargadas -> el botón sigue mostrando "1 restante", no desapareció.
  expect(screen.getByRole('button', { name: /Cargar más · 1 restantes/i })).toBeInTheDocument();

  // fetch de la segunda página debe haber pedido page=2, no volver a page=1.
  const propertyCalls = global.fetch.mock.calls.filter(([u]) => u.includes('/api/properties?'));
  expect(propertyCalls.some(([u]) => new URL(u).searchParams.get('page') === '2')).toBe(true);
});
