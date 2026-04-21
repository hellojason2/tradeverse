import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AppShell } from '@/components/layout/AppShell';
import { RequireAuth, RequireRole, GuestGuard } from '@/routes/guards';

const DashboardPage = lazy(() => import('@/pages').then((m) => ({ default: m.DashboardPage })));
const StrategiesPage = lazy(() => import('@/pages').then((m) => ({ default: m.StrategiesPage })));
const CopyTradingPage = lazy(() => import('@/pages').then((m) => ({ default: m.CopyTradingPage })));
const WalletPage = lazy(() => import('@/pages').then((m) => ({ default: m.WalletPage })));
const NotificationsPage = lazy(() => import('@/pages').then((m) => ({ default: m.NotificationsPage })));
const SettingsPage = lazy(() => import('@/pages').then((m) => ({ default: m.SettingsPage })));
const AtlasGoldPage = lazy(() => import('@/pages').then((m) => ({ default: m.AtlasGoldPage })));
const AdminPage = lazy(() => import('@/pages').then((m) => ({ default: m.AdminPage })));
const LoginPage = lazy(() => import('@/pages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages').then((m) => ({ default: m.RegisterPage })));
const OAuthCallbackPage = lazy(() => import('@/pages').then((m) => ({ default: m.OAuthCallbackPage })));
const NotFoundPage = lazy(() => import('@/pages').then((m) => ({ default: m.NotFoundPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030611]">
      <div className="w-8 h-8 border-2 border-[#4f8eff] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Suspense fallback={<PageSpinner />}>
            <Routes>
              {/* Guest routes */}
              <Route element={<GuestGuard />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

              {/* Authenticated routes */}
              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/strategies" element={<StrategiesPage />} />
                  <Route path="/copy-trading" element={<CopyTradingPage />} />
                  <Route path="/wallet" element={<WalletPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/atlas-gold" element={<AtlasGoldPage />} />
                  <Route element={<RequireRole role={['ADMIN', 'MANAGER']} />}>
                    <Route path="/admin" element={<AdminPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'linear-gradient(180deg, rgba(14,20,44,0.9), rgba(8,12,28,0.9))',
              border: '1px solid rgba(255,255,255,0.14)',
              color: '#f5f7ff',
              borderRadius: '10px',
              backdropFilter: 'blur(20px)',
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
