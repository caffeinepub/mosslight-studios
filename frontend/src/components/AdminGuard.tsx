import { ReactNode } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { Navigate } from '@tanstack/react-router';
import AccessDeniedScreen from './AccessDeniedScreen';

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { isAdminAuthenticated } = useAdminAuth();

  if (!isAdminAuthenticated) {
    return <AccessDeniedScreen />;
  }

  return <>{children}</>;
}
