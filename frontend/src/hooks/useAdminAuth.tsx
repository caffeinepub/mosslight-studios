import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';

const ADMIN_PASSCODE = '09131991';
const ADMIN_SESSION_KEY = 'adminSession';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const HARDCODED_ADMIN_PRINCIPAL = 'axgif-6oipb-lnqzh-ddzf3-hsjsz-2nw65-g34cg-npb6b-jxnhn-jnnch-6qe';

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
  const { identity } = useInternetIdentity();

  // Check if the current Internet Identity principal is the hardcoded admin
  const isHardcodedAdmin = !!identity && identity.getPrincipal().toString() === HARDCODED_ADMIN_PRINCIPAL;

  // Auto-authenticate if the hardcoded admin principal is logged in
  useEffect(() => {
    if (isHardcodedAdmin) {
      setIsAdminAuthenticated(true);
    }
  }, [isHardcodedAdmin]);

  // Check for existing valid session on mount (for passcode-based auth)
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

  // When actor becomes available and admin is authenticated via passcode, register with backend
  useEffect(() => {
    if (actor && isAdminAuthenticated && !isHardcodedAdmin) {
      setIsInitializingAdmin(true);
      actor._initializeAccessControlWithSecret(ADMIN_PASSCODE)
        .catch(() => {
          // Silently handle - may already be initialized
        })
        .finally(() => {
          setIsInitializingAdmin(false);
        });
    }
  }, [actor, isAdminAuthenticated, isHardcodedAdmin]);

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
    // Don't log out if authenticated via hardcoded principal
    if (isHardcodedAdmin) return;
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdminAuthenticated(false);
  }, [isHardcodedAdmin]);

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, isInitializingAdmin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
