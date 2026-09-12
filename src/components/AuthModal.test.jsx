import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AuthModal from './AuthModal';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { vi } from 'vitest';

function mockFetch(overrides = {}) {
  global.fetch = vi.fn((url, options) => {
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
    }
    if (url.includes('/api/auth/login') && overrides.login) {
      return overrides.login(options);
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

function openAuthModal(onClose) {
  render(
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider>
          <AuthModal isOpen={true} onClose={onClose} />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

test('rechaza un correo inválido sin llamar al backend', async () => {
  mockFetch();
  const user = userEvent.setup();
  openAuthModal(vi.fn());

  await user.type(screen.getByPlaceholderText('tu@email.com'), 'no-es-un-correo');
  await user.type(screen.getByPlaceholderText('••••••••'), 'clave12345');
  await user.click(screen.getByRole('button', { name: /iniciar sesión →/i }));

  expect(await screen.findByText(/correo electrónico válido/i)).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalledWith(
    expect.stringContaining('/api/auth/login'),
    expect.anything()
  );
});

test('login exitoso llama al backend con las credenciales y cierra el modal', async () => {
  mockFetch({
    login: () => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        user: { id: 'u1', name: 'Ana', email: 'ana@domify.test', role: 'CLIENTE' },
      }),
    }),
  });
  const user = userEvent.setup();
  const onClose = vi.fn();
  openAuthModal(onClose);

  await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@domify.test');
  await user.type(screen.getByPlaceholderText('••••••••'), 'clave12345');
  await user.click(screen.getByRole('button', { name: /iniciar sesión →/i }));

  await waitFor(() => expect(onClose).toHaveBeenCalled());

  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/auth/login'),
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'ana@domify.test', password: 'clave12345' }),
    })
  );
});

test('login rechazado muestra el mensaje de error del backend y no cierra el modal', async () => {
  mockFetch({
    login: () => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Credenciales incorrectas' }),
    }),
  });
  const user = userEvent.setup();
  const onClose = vi.fn();
  openAuthModal(onClose);

  await user.type(screen.getByPlaceholderText('tu@email.com'), 'ana@domify.test');
  await user.type(screen.getByPlaceholderText('••••••••'), 'clave-mala-1');
  await user.click(screen.getByRole('button', { name: /iniciar sesión →/i }));

  // El bloque de error es "⚠️ {error}" — dos nodos de texto separados, por
  // eso hace falta un regex (matchea el textContent completo del div) en
  // vez de un string exacto.
  expect(await screen.findByText(/Credenciales incorrectas/)).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
});
