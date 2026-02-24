import { ReactNode } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import AccessDeniedScreen from './AccessDeniedScreen';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { isAdminAuthenticated, isInitializingAdmin } = useAdminAuth();

  // Show a loading state while we're checking admin status
  if (isInitializingAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <p className="text-sm text-muted-foreground mt-2">Verifying admin access...</p>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <AccessDeniedScreen />;
  }

  return <>{children}</>;
}
