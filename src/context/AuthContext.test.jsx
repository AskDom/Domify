import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

function Probe() {
  const { currentUser } = useAuth();
  return <div>{currentUser ? `logueado:${currentUser.name}` : 'sin-sesion'}</div>;
}

function mockFetchLoggedIn() {
  global.fetch = vi.fn((url) => {
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { id: '1', name: 'Gil', email: 'gil@test.com', role: 'CLIENTE' } }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
  localStorage.clear();
});

test('se desloguea cuando otra pestaña dispara el ping de logout', async () => {
  mockFetchLoggedIn();
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

  await waitFor(() => screen.getByText('logueado:Gil'));

  // Simula el evento "storage" que dispara OTRA pestaña al llamar logout()
  // (en la misma pestaña que escribe, el navegador nunca dispara este
  // evento — por eso hay que despacharlo a mano acá).
  window.dispatchEvent(new StorageEvent('storage', { key: 'domify-logout-ping', newValue: String(Date.now()) }));

  await waitFor(() => screen.getByText('sin-sesion'));
});
