import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const ADMIN_PASSCODE = '09131991';
const ADMIN_SESSION_KEY = 'mosslight_admin_session';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminLogin: (passcode: string) => boolean;
  adminLogout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    // Check if admin session exists in localStorage
    const session = localStorage.getItem(ADMIN_SESSION_KEY);
    if (session === 'authenticated') {
      setIsAdminAuthenticated(true);
    }
  }, []);

  const adminLogin = (passcode: string): boolean => {
    if (passcode === ADMIN_PASSCODE) {
      setIsAdminAuthenticated(true);
      localStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem(ADMIN_SESSION_KEY);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
