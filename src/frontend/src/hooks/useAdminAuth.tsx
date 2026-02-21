import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useInternetIdentity } from './useInternetIdentity';
import { useActor } from './useActor';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  login: (passcode: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_PASSCODE = '09131991';
const ADMIN_AUTH_KEY = 'mosslight_admin_auth';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const { identity } = useInternetIdentity();
  const { actor } = useActor();

  // Check localStorage on mount and when identity changes
  useEffect(() => {
    const checkAdminAuth = () => {
      const stored = localStorage.getItem(ADMIN_AUTH_KEY);
      if (stored && identity) {
        const { principal, timestamp } = JSON.parse(stored);
        const currentPrincipal = identity.getPrincipal().toString();
        
        // Verify the stored principal matches current identity
        // and session is less than 24 hours old
        const isValid = 
          principal === currentPrincipal && 
          Date.now() - timestamp < 24 * 60 * 60 * 1000;
        
        setIsAdminAuthenticated(isValid);
        
        if (!isValid) {
          localStorage.removeItem(ADMIN_AUTH_KEY);
        }
      } else {
        setIsAdminAuthenticated(false);
      }
    };

    checkAdminAuth();
  }, [identity]);

  const login = async (passcode: string): Promise<boolean> => {
    if (passcode !== ADMIN_PASSCODE) {
      return false;
    }

    if (!identity) {
      throw new Error('You must be logged in with Internet Identity first');
    }

    if (!actor) {
      throw new Error('Backend actor not available');
    }

    try {
      // Verify backend admin status
      const isBackendAdmin = await actor.isCallerAdmin();
      
      if (!isBackendAdmin) {
        throw new Error(
          'Your Internet Identity principal is not registered as an admin in the backend. ' +
          'Please contact the system administrator to grant admin access to your principal: ' +
          identity.getPrincipal().toString()
        );
      }

      // Store admin auth with current principal
      const authData = {
        principal: identity.getPrincipal().toString(),
        timestamp: Date.now(),
      };
      localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(authData));
      setIsAdminAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setIsAdminAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
