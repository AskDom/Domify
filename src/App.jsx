import { lazy, Suspense, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { trackPageView } from "./analytics";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { PropertiesProvider } from "./context/PropertiesContext";
import { InboxProvider } from "./context/InboxContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import { ToastProvider } from "./context/ToastContext";
import { AnimatePresence } from "framer-motion";

// Code-splitting: cada ruta descarga su propio chunk en vez de traer
// Leaflet + Framer Motion + el panel admin en el bundle inicial (antes ~850KB
// minificados en un solo archivo). Home se carga apenas arranca la app.
const Home           = lazy(() => import("./pages/Home"));
const Publish        = lazy(() => import("./pages/Publish"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const SearchResults  = lazy(() => import("./pages/SearchResults"));
const Profile        = lazy(() => import("./pages/Profile"));
const AgentProfile   = lazy(() => import("./pages/AgentProfile"));
const Favorites      = lazy(() => import("./pages/Favorites"));
const Inbox          = lazy(() => import("./pages/Inbox"));
const NotFound       = lazy(() => import("./pages/NotFound"));
const Admin          = lazy(() => import("./pages/Admin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword  = lazy(() => import("./pages/ResetPassword"));
const Terminos       = lazy(() => import("./pages/Terminos"));
const Privacidad     = lazy(() => import("./pages/Privacidad"));
const Cookies        = lazy(() => import("./pages/Cookies"));
import ProtectedRoute from "./components/ProtectedRoute";
import PageTransition from "./components/PageTransition";

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 rounded-full border-4 border-brand-700 border-t-transparent animate-spin" />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  useEffect(() => {
    // Solo el pathname, nunca location.search: la query string puede llevar
    // datos sensibles (p. ej. el token de /reset-password?token=...) y no
    // queremos que viajen a Google Analytics.
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <Suspense fallback={<RouteFallback />}>
    <ErrorBoundary>
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/search" element={<PageTransition><SearchResults /></PageTransition>} />
        <Route path="/property/:id" element={<PageTransition><PropertyDetail /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/agent/:id" element={<PageTransition><AgentProfile /></PageTransition>} />
        <Route path="/favorites" element={<PageTransition><Favorites /></PageTransition>} />
        <Route path="/inbox" element={<PageTransition><Inbox /></PageTransition>} />
        <Route path="/publish" element={
          <PageTransition>
            <ProtectedRoute>
              <Publish />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/admin" element={
          <PageTransition>
            <ProtectedRoute requiredRole="admin">
              <Admin />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/terminos" element={<PageTransition><Terminos /></PageTransition>} />
        <Route path="/privacidad" element={<PageTransition><Privacidad /></PageTransition>} />
        <Route path="/cookies" element={<PageTransition><Cookies /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
    </ErrorBoundary>
    </Suspense>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <PropertiesProvider>
            <InboxProvider>
              <NotificationsProvider>
                <ToastProvider>
                  <Router>
                    <AnimatedRoutes />
                  </Router>
                </ToastProvider>
              </NotificationsProvider>
            </InboxProvider>
          </PropertiesProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;