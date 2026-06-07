import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Terms from './pages/Terms';
import TermsGate from './components/TermsGate';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function FullPageSpinner() {
  return (
    <div className="h-screen flex items-center justify-center bg-zinc-950">
      <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 backdrop-blur-xl">
        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
        <span data-testid="loading-indicator" className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-300">
          Loading…
        </span>
      </div>
    </div>
  );
}

function AppRouter() {
  const location = useLocation();
  // Detect session_id during render (synchronously) before ProtectedRoute fires
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/terms" element={<Terms />} />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <TermsGate>
              <Dashboard />
            </TermsGate>
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  );
}
