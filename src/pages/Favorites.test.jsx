import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Favorites from './Favorites';
import { renderWithProviders, mockApiFetch } from '../testUtils/renderWithProviders';
import { vi } from 'vitest';

const LOGGED_IN_USER = { id: 'u1', name: 'Ana', email: 'ana@domify.test', role: 'CLIENTE' };

const FAVORITE_PROPERTY = {
  id: 'p1',
  title: 'Apartamento en Piantini',
  price: 120000,
  currency: 'USD',
  city: 'Santo Domingo',
  sector: 'Piantini',
  rooms: 2,
  baths: 2,
  parking: 1,
  type: 'APARTAMENTO',
  status: 'VENTA',
  verified: false,
  images: ['https://example.com/foto.jpg'],
};

function mockLoggedOut() {
  mockApiFetch({
    '/api/auth/me': () => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) }),
  });
}

function mockLoggedIn({ favoriteIds = [], properties = [] } = {}) {
  mockApiFetch({
    '/api/auth/me':   () => Promise.resolve({ ok: true, json: () => Promise.resolve({ user: LOGGED_IN_USER }) }),
    '/api/properties': () => Promise.resolve({ ok: true, json: () => Promise.resolve({ properties }) }),
    '/api/favorites':  () => Promise.resolve({ ok: true, json: () => Promise.resolve({ favorites: favoriteIds }) }),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

test('sin sesión, muestra el gate de login en vez de la lista', async () => {
  mockLoggedOut();
  renderWithProviders(<Favorites />, { route: '/favorites' });

  expect(await screen.findByText('Inicia sesión para ver tus favoritos')).toBeInTheDocument();
});

test('con sesión y sin favoritos, muestra el estado vacío', async () => {
  mockLoggedIn({ favoriteIds: [], properties: [] });
  renderWithProviders(<Favorites />, { route: '/favorites' });

  // Por rol, no por texto — "Mis favoritos" también aparece en la Navbar.
  expect(await screen.findByRole('heading', { name: 'Mis favoritos' })).toBeInTheDocument();
  expect(await screen.findByText('No tienes propiedades guardadas')).toBeInTheDocument();
});

test('con sesión y una propiedad favorita, la muestra en la lista', async () => {
  mockLoggedIn({ favoriteIds: ['p1'], properties: [FAVORITE_PROPERTY] });
  renderWithProviders(<Favorites />, { route: '/favorites' });

  expect(await screen.findByText('Apartamento en Piantini')).toBeInTheDocument();
  expect(screen.getByText('1 propiedad guardada')).toBeInTheDocument();
});

test('quitar de favoritos llama a la API y saca la propiedad de la lista', async () => {
  mockLoggedIn({ favoriteIds: ['p1'], properties: [FAVORITE_PROPERTY] });
  const user = userEvent.setup();
  renderWithProviders(<Favorites />, { route: '/favorites' });

  await screen.findByText('Apartamento en Piantini');

  await user.click(screen.getByTitle('Quitar de favoritos'));

  expect(await screen.findByText('No tienes propiedades guardadas')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/favorites/p1'),
    expect.objectContaining({ method: 'DELETE' })
  );
});
