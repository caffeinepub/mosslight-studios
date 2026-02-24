import { Link, useNavigate } from '@tanstack/react-router';
import { ShoppingCart, Menu, X, Shield, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NotificationBell from './NotificationBell';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useViewCart } from '../hooks/useCart';
import AdminLoginModal from './AdminLoginModal';
import LoginButton from './LoginButton';
import { useQueryClient } from '@tanstack/react-query';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const navigate = useNavigate();
  const { identity, clear, loginStatus, login } = useInternetIdentity();
  const { isAdminAuthenticated, logout } = useAdminAuth();
  const { data: cartItems = [] } = useViewCart();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';
  const cartItemCount = cartItems.reduce((sum, item) => sum + Number(item.quantity), 0);

  const handleAdminLogout = () => {
    logout();
    navigate({ to: '/' });
  };

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      navigate({ to: '/admin-dashboard' });
    } else {
      setShowAdminModal(true);
    }
  };

  const handleClientAuth = async () => {
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
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/assets/619647707_122115297897152953_3726434048431036262_n.jpg"
                alt="Mosslight Studios" 
                className="h-11 w-11 object-contain rounded-full"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/products" 
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                activeProps={{ className: 'text-primary' }}
              >
                Shop
              </Link>
              <Link 
                to="/gallery" 
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                activeProps={{ className: 'text-primary' }}
              >
                Gallery
              </Link>
              <Link 
                to="/about" 
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                activeProps={{ className: 'text-primary' }}
              >
                About
              </Link>
              <Link 
                to="/faq" 
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                activeProps={{ className: 'text-primary' }}
              >
                FAQ
              </Link>
              <Link 
                to="/forum" 
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                activeProps={{ className: 'text-primary' }}
              >
                Forum
              </Link>
              {isAuthenticated && (
                <Link 
                  to="/my-orders" 
                  className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                  activeProps={{ className: 'text-primary' }}
                >
                  My Orders
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Admin controls */}
            {isAdminAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAdminLogout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout Admin
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: '/admin-dashboard' })}
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Dashboard
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdminAccess}
                className="hidden md:flex gap-2 text-muted-foreground hover:text-primary"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            )}

            {/* Client login/logout */}
            <div className="hidden md:flex">
              <LoginButton />
            </div>

            {/* Notification bell for authenticated clients */}
            {isAuthenticated && <NotificationBell />}

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate({ to: '/cart' })}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="container py-4 flex flex-col gap-4">
              <Link 
                to="/products" 
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop
              </Link>
              <Link 
                to="/gallery" 
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Gallery
              </Link>
              <Link 
                to="/about" 
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                to="/faq" 
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link 
                to="/forum" 
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Forum
              </Link>
              {isAuthenticated && (
                <Link 
                  to="/my-orders" 
                  className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Orders
                </Link>
              )}

              {/* Mobile client login/logout */}
              <div className="pt-1 border-t">
                {isAuthenticated ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleClientAuth();
                      setMobileMenuOpen(false);
                    }}
                    className="gap-2 justify-start w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      handleClientAuth();
                      setMobileMenuOpen(false);
                    }}
                    disabled={isLoggingIn}
                    className="gap-2 justify-start w-full"
                  >
                    <User className="h-4 w-4" />
                    {isLoggingIn ? 'Logging in...' : 'Login'}
                  </Button>
                )}
              </div>

              {/* Mobile admin controls */}
              <div className="pt-1 border-t">
                {isAdminAuthenticated ? (
                  <>
                    <Link 
                      to="/admin-dashboard" 
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-2 mb-3"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleAdminLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="gap-2 justify-start w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout Admin
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleAdminAccess();
                      setMobileMenuOpen(false);
                    }}
                    className="gap-2 justify-start w-full text-muted-foreground"
                  >
                    <Shield className="h-4 w-4" />
                    Admin Login
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <AdminLoginModal open={showAdminModal} onOpenChange={setShowAdminModal} />
    </>
  );
}
