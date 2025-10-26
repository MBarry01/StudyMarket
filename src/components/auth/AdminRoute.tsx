import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const getEnvList = (value?: string | boolean | number | null): string[] => {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const envEmails = getEnvList(import.meta.env.VITE_ADMIN_EMAILS as any);
  const envUids = getEnvList(import.meta.env.VITE_ADMIN_UIDS as any);
  // Admins configurés (GitHub Secrets + fallback)
  const hardcodedEmails = ['barrymohamadou98@gmail.com', 'mb3186802@gmail.com'];
  const hardcodedUids = ['q8R6wG9lNAOKJnCuUgMFpZFRHKg1'];
  const allowedEmails = [...envEmails, ...hardcodedEmails];
  const allowedUids = [...envUids, ...hardcodedUids];

  const isAllowed =
    (currentUser.email && allowedEmails.includes(currentUser.email)) ||
    allowedUids.includes(currentUser.uid);

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
