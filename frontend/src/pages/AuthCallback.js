import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash || '';
    const match = hash.match(/session_id=([^&]+)/);
    const sessionId = match ? decodeURIComponent(match[1]) : null;

    (async () => {
      if (!sessionId) {
        navigate('/login', { replace: true });
        return;
      }
      try {
        const { data } = await api.post('/auth/google', { session_id: sessionId });
        setUser(data.user);
        // Clean URL fragment then go to dashboard
        window.history.replaceState({}, '', '/dashboard');
        navigate('/dashboard', { replace: true, state: { user: data.user } });
      } catch (e) {
        console.error('Auth exchange failed', e);
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="text-xs font-mono uppercase tracking-widest text-zinc-600">
        Signing you in…
      </div>
    </div>
  );
}
