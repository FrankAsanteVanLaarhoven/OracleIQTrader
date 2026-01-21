import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleAuthCallback } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      // Extract session_id from URL hash
      const hash = location.hash;
      const params = new URLSearchParams(hash.replace('#', ''));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        console.error('No session_id found in URL');
        navigate('/login', { replace: true });
        return;
      }

      try {
        const user = await handleAuthCallback(sessionId);
        // Navigate to dashboard with user data to skip auth check
        navigate('/', { replace: true, state: { user } });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login', { replace: true });
      }
    };

    processAuth();
  }, [location.hash, handleAuthCallback, navigate]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-teal-500 border-t-transparent mx-auto mb-4" />
        <p className="text-slate-400 font-mono">Authenticating...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
