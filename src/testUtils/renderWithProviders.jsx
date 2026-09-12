import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { PropertiesProvider } from '../context/PropertiesContext';
import { InboxProvider } from '../context/InboxContext';
import { NotificationsProvider } from '../context/NotificationsContext';
import { ToastProvider } from '../context/ToastContext';

// Mockea global.fetch por patrón de URL. `handlers` es { "/api/algo": (options) => Promise<Response> }.
// Cualquier URL sin handler explícito cae al catch-all: listas vacías en
// vez de un objeto vacío, para que un `.map`/`.filter` sobre un campo
// esperado (mensajes, notificaciones, favoritos...) no rompa el render.
export function mockApiFetch(handlers = {}) {
  global.fetch = vi.fn((url, options) => {
    const match = Object.keys(handlers).find((pattern) => url.includes(pattern));
    if (match) return handlers[match](options);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        messages: [], notifications: [], favorites: [], properties: [],
        unreadCount: 0, total: 0,
      }),
    });
  });
}

// Envuelve un componente con el mismo stack de providers que App.js, para
// páginas/componentes que dependen de Navbar (Theme, Auth, Properties,
// Inbox, Notifications) además de routing y toasts.
export function renderWithProviders(ui, { route = '/' } = {}) {
  window.history.pushState({}, '', route);
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <PropertiesProvider>
              <InboxProvider>
                <NotificationsProvider>
                  {ui}
                </NotificationsProvider>
              </InboxProvider>
            </PropertiesProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}
