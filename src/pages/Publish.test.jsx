import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Publish from './Publish';
import { renderWithProviders, mockApiFetch } from '../testUtils/renderWithProviders';
import { vi } from 'vitest';

const VENDEDOR = { id: 'v1', name: 'Juan Vendedor', email: 'juan@domify.test', role: 'VENDEDOR' };

function mockLoggedInAs(user, { properties = [] } = {}) {
  mockApiFetch({
    '/api/auth/me':   () => Promise.resolve({ ok: true, json: () => Promise.resolve({ user }) }),
    '/api/properties': () => Promise.resolve({ ok: true, json: () => Promise.resolve({ properties }) }),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

test('sin completar nada, marca los campos requeridos y no publica', async () => {
  mockLoggedInAs(VENDEDOR);
  const user = userEvent.setup();
  renderWithProviders(<Publish />, { route: '/publish' });

  await screen.findByRole('heading', { name: 'Publicar propiedad' });

  await user.click(screen.getByRole('button', { name: /publicar propiedad/i }));

  expect(await screen.findByText('Selecciona una ubicación en el mapa')).toBeInTheDocument();
  expect(screen.getAllByText('Requerido').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Requerida').length).toBeGreaterThan(0);
  expect(global.fetch).not.toHaveBeenCalledWith(
    expect.stringContaining('/api/properties'),
    expect.objectContaining({ method: 'POST' })
  );
});

test('un vendedor que ya llegó al límite ve el aviso de límite alcanzado', async () => {
  const misPropiedades = [1, 2, 3].map((n) => ({
    id: `p${n}`,
    title: `Propiedad ${n}`,
    price: 1000,
    currency: 'USD',
    city: 'Santo Domingo',
    type: 'APARTAMENTO',
    status: 'VENTA',
    images: [],
    publishedById: VENDEDOR.id,
  }));
  mockLoggedInAs(VENDEDOR, { properties: misPropiedades });
  renderWithProviders(<Publish />, { route: '/publish' });

  expect(await screen.findByText(/Límite alcanzado — 3\/3 propiedades publicadas/)).toBeInTheDocument();
});
