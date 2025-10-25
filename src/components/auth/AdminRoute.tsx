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

  const allowedEmails = getEnvList(import.meta.env.VITE_ADMIN_EMAILS as any);
  const allowedUids = getEnvList(import.meta.env.VITE_ADMIN_UIDS as any);

  const isAllowed =
    (currentUser.email && allowedEmails.includes(currentUser.email)) ||
    allowedUids.includes(currentUser.uid);

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
