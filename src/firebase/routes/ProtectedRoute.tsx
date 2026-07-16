import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { RouteGuardProps } from '../types';

const FullScreenLoader: React.FC = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-main)',
  }}>
    <div style={{
      width: '50px',
      height: '50px',
      border: '3px solid var(--border-color)',
      borderTopColor: 'var(--primary)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export const ProtectedRoute: React.FC<RouteGuardProps> = ({
  children,
  allowedRoles,
  requireEmailVerified = false,
  redirectTo = '/auth',
}) => {
  const location = useLocation();
  const { currentUser, profile, role, loading, initialized, isEmailVerified } = useAuth();

  if (loading || !initialized) {
    return <FullScreenLoader />;
  }

  // In mock mode currentUser is null; profile is the source of truth
  const isAuthenticated = Boolean(currentUser ?? profile);

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ redirectTo: location.pathname }} />;
  }

  if (requireEmailVerified && !isEmailVerified) {
    return <Navigate to="/auth" replace state={{ redirectTo: location.pathname, verifyEmail: true }} />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
