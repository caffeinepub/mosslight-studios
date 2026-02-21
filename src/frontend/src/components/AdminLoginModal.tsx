import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { Loader2, AlertCircle, Info } from 'lucide-react';

interface AdminLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminLoginModal({ open, onOpenChange }: AdminLoginModalProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();
  const { identity, login: iiLogin } = useInternetIdentity();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identity) {
      setError('Please log in with Internet Identity first');
      return;
    }

    if (passcode.length !== 8) {
      setError('Passcode must be 8 digits');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(passcode);
      if (success) {
        onOpenChange(false);
        setPasscode('');
        navigate({ to: '/admin-dashboard' });
      } else {
        setError('Invalid passcode');
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(err.message || 'Failed to authenticate as admin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInternetIdentityLogin = async () => {
    try {
      await iiLogin();
    } catch (err: any) {
      setError(err.message || 'Failed to log in with Internet Identity');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Admin Login</DialogTitle>
          <DialogDescription>
            Enter the admin passcode to access the admin dashboard
          </DialogDescription>
        </DialogHeader>

        {!identity ? (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You must first log in with Internet Identity before entering the admin passcode.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleInternetIdentityLogin} 
              className="w-full"
            >
              Log in with Internet Identity
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passcode">Admin Passcode</Label>
              <Input
                id="passcode"
                type="password"
                placeholder="Enter 8-digit passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                maxLength={8}
                disabled={isLoading}
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setPasscode('');
                  setError('');
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || passcode.length !== 8}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
