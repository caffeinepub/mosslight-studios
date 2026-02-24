import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useActor } from './useActor';

const ADMIN_PASSCODE = '09131991';
const ADMIN_SESSION_KEY = 'adminSession';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface AdminSession {
  authenticated: boolean;
  timestamp: number;
}

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  isInitializingAdmin: boolean;
  login: (passcode: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAdminAuthenticated: false,
  isInitializingAdmin: false,
  login: async () => false,
  logout: () => {},
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isInitializingAdmin, setIsInitializingAdmin] = useState(false);
  const { actor } = useActor();

  // Check for existing valid session on mount
  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_SESSION_KEY);
    if (stored) {
      try {
        const session: AdminSession = JSON.parse(stored);
        const isValid = session.authenticated && (Date.now() - session.timestamp) < SESSION_DURATION;
        if (isValid) {
          setIsAdminAuthenticated(true);
        } else {
          localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }
  }, []);

  // When actor becomes available and admin is authenticated, register with backend
  useEffect(() => {
    if (actor && isAdminAuthenticated) {
      setIsInitializingAdmin(true);
      actor._initializeAccessControlWithSecret(ADMIN_PASSCODE)
        .catch(() => {
          // Silently handle - may already be initialized
        })
        .finally(() => {
          setIsInitializingAdmin(false);
        });
    }
  }, [actor, isAdminAuthenticated]);

  const login = useCallback(async (passcode: string): Promise<boolean> => {
    if (passcode !== ADMIN_PASSCODE) {
      return false;
    }

    // Register with backend if actor is available
    if (actor) {
      setIsInitializingAdmin(true);
      try {
        await actor._initializeAccessControlWithSecret(ADMIN_PASSCODE);
      } catch {
        // May already be initialized, continue
      } finally {
        setIsInitializingAdmin(false);
      }
    }

    const session: AdminSession = {
      authenticated: true,
      timestamp: Date.now(),
    };
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    setIsAdminAuthenticated(true);
    return true;
  }, [actor]);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdminAuthenticated(false);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, isInitializingAdmin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
