import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, signInWithApple } from '../../services/authService';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LanguageToggle } from '../Layout/LanguageToggle';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { firebaseUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user is already logged in, redirect to feed
  if (authLoading) {
    return (
      <div className="auth-page">
        <img src="/logo2.png" alt="HUSH" className="auth-logo" />
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (firebaseUser) {
    navigate('/', { replace: true });
    return null;
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate('/', { replace: true });
    } catch (err: unknown) {
      console.error('Google sign-in failed:', err);
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      if (!message.includes('popup-closed-by-user')) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithApple();
      navigate('/', { replace: true });
    } catch (err: unknown) {
      console.error('Apple sign-in failed:', err);
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      if (!message.includes('popup-closed-by-user')) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" id="login-page">
      <div style={{ position: 'absolute', top: 'var(--space-lg)', insetInlineEnd: 'var(--space-lg)' }}>
        <LanguageToggle />
      </div>

      <img src="/logo2.png" alt="HUSH" className="auth-logo" />
      <h1 className="auth-title">{t('auth.welcome')}</h1>
      <p className="auth-subtitle">{t('auth.subtitle')}</p>

      {error && (
        <div style={{
          color: 'var(--tier-red)',
          background: 'rgba(239, 68, 68, 0.1)',
          padding: 'var(--space-sm) var(--space-md)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-sm)',
          marginBottom: 'var(--space-md)',
          maxWidth: '360px',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      ) : (
        <div className="auth-buttons">
          <button className="auth-btn" onClick={handleGoogleSignIn} id="google-signin-btn">
            <svg className="auth-btn-icon" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t('auth.signInGoogle')}
          </button>

          <button className="auth-btn" onClick={handleAppleSignIn} id="apple-signin-btn">
            <svg className="auth-btn-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.53-3.2 0-1.44.68-2.2.49-3.08-.4C3.79 16.25 4.36 9.11 8.79 8.85c1.21.07 2.05.69 2.76.74.96-.2 1.88-.76 2.91-.69 1.23.1 2.16.58 2.78 1.49-2.55 1.53-1.95 4.89.56 5.83-.47 1.24-.82 2.07-1.75 4.06zM12.05 8.76c-.13-2.29 1.74-4.26 3.95-4.47.29 2.56-2.31 4.66-3.95 4.47z"/>
            </svg>
            {t('auth.signInApple')}
          </button>
        </div>
      )}
    </div>
  );
}
