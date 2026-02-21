import { Link, useNavigate } from '@tanstack/react-router';
import { ShoppingCart, Menu, X, Shield, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoginButton from './LoginButton';
import NotificationBell from './NotificationBell';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useGetCallerUserRole } from '../hooks/useUserProfile';
import { useViewCart } from '../hooks/useCart';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { isAdminAuthenticated, logout } = useAdminAuth();
  const { data: userRole } = useGetCallerUserRole();
  const { data: cartItems = [] } = useViewCart();
  
  const isAuthenticated = !!identity;
  const isBackendAdmin = userRole === 'admin';
  const cartItemCount = cartItems.reduce((sum, item) => sum + Number(item.quantity), 0);

  const handleAdminLogout = () => {
    logout();
    navigate({ to: '/' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/assets/generated/logo.dim_400x400.png" 
              alt="Mosslight Studios" 
              className="h-10 w-10 object-contain"
            />
            <span className="font-serif text-xl font-semibold text-primary">
              Mosslight Studios
            </span>
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
            {isAdminAuthenticated && (
              <Link 
                to="/admin-dashboard" 
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Admin Dashboard
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isAdminAuthenticated && (
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
            </div>
          )}

          {isAuthenticated && <NotificationBell />}

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

          <div className="hidden md:block">
            <LoginButton />
          </div>

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
            {isAdminAuthenticated && (
              <>
                <Link 
                  to="/admin-dashboard" 
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
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
                  className="gap-2 justify-start"
                >
                  <LogOut className="h-4 w-4" />
                  Logout Admin
                </Button>
              </>
            )}
            <div className="pt-2 border-t">
              <LoginButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
