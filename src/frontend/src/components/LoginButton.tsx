import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Shield } from 'lucide-react';
import AdminLoginModal from './AdminLoginModal';

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [showAdminModal, setShowAdminModal] = useState(false);

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const text = loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleAuth}
        disabled={disabled}
        variant={isAuthenticated ? 'outline' : 'default'}
        className="gap-2"
      >
        {isAuthenticated ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
        {text}
      </Button>
      
      {!isAuthenticated && (
        <Button
          onClick={() => setShowAdminModal(true)}
          variant="secondary"
          className="gap-2 bg-primary/10 hover:bg-primary/20 text-primary"
        >
          <Shield className="h-4 w-4" />
          Admin Login
        </Button>
      )}

      <AdminLoginModal open={showAdminModal} onOpenChange={setShowAdminModal} />
    </div>
  );
}
