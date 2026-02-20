import { Link, useNavigate } from '@tanstack/react-router';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import LoginButton from './LoginButton';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserRole } from '../hooks/useUserProfile';
import { useViewCart } from '../hooks/useCart';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: userRole } = useGetCallerUserRole();
  const { data: cartItems = [] } = useViewCart();
  
  const isAuthenticated = !!identity;
  const isAdmin = userRole === 'admin';
  const cartItemCount = cartItems.reduce((sum, item) => sum + Number(item.quantity), 0);

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
            >
              Shop
            </Link>
            <Link 
              to="/gallery" 
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              Gallery
            </Link>
            <Link 
              to="/forum" 
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              Forum
            </Link>
            {isAuthenticated && (
              <Link 
                to="/my-orders" 
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                My Orders
              </Link>
            )}
            {isAdmin && (
              <Link 
                to="/admin/products" 
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
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
            {isAdmin && (
              <Link 
                to="/admin/products" 
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
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
