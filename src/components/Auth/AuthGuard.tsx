import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <img src="/logo2.png" alt="HUSH" className="auth-logo" />
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
