import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ScrollToTop } from '@/components/ScrollToTop';
import { ThemeProvider } from '@/lib/theme';
import { AppShell } from '@/components/AppShell';
import { Tutorial } from '@/components/Tutorial';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Properties } from '@/pages/Properties';
import { PropertyDetail } from '@/pages/PropertyDetail';
import { Inspections } from '@/pages/Inspections';
import { InspectionRun } from '@/pages/InspectionRun';
import { InspectionDetail } from '@/pages/InspectionDetail';
import { Tickets } from '@/pages/Tickets';
import { TicketDetail } from '@/pages/TicketDetail';
import { NewInspection } from '@/pages/NewInspection';
import { NotFound } from '@/pages/NotFound';
import { ServerError } from '@/pages/ServerError';
import { Settings } from '@/pages/Settings';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      <AppShell>{children}</AppShell>
      <Tutorial />
    </>
  );
}

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="font-mono text-xs uppercase tracking-widest animate-pulse">Loading…</div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/app" element={<Protected><Dashboard /></Protected>} />
              <Route path="/app/properties" element={<Protected><Properties /></Protected>} />
              <Route path="/app/properties/:id" element={<Protected><PropertyDetail /></Protected>} />
              <Route path="/app/inspections" element={<Protected><Inspections /></Protected>} />
              <Route path="/app/inspections/new" element={<Protected><NewInspection /></Protected>} />
              <Route path="/app/inspections/:id" element={<Protected><InspectionDetail /></Protected>} />
              <Route path="/app/inspections/:id/run" element={<Protected><InspectionRun /></Protected>} />
              <Route path="/app/tickets" element={<Protected><Tickets /></Protected>} />
              <Route path="/app/tickets/:id" element={<Protected><TicketDetail /></Protected>} />
              <Route path="/app/settings" element={<Protected><Settings /></Protected>} />
              <Route path="/500" element={<ServerError />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster
            position="bottom-right"
            toastOptions={{
              unstyled: true,
              classNames: {
                toast: 'brut-card font-mono text-sm px-4 py-3 flex items-center gap-3 min-w-[300px]',
                title: 'font-bold uppercase tracking-wider text-xs',
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
