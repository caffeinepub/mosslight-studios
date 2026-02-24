import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';

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
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const registrationAttempted = useRef(false);

  const isAuthenticated = !!identity;

  // Check for existing valid passcode session on mount
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

  // When actor is ready and user is authenticated via Internet Identity,
  // call registerOrLogin() to auto-register the first user as admin,
  // then check if the caller is admin.
  useEffect(() => {
    if (!actor || actorFetching || !isAuthenticated || registrationAttempted.current) {
      return;
    }

    registrationAttempted.current = true;
    setIsInitializingAdmin(true);

    (async () => {
      try {
        // This registers the caller as admin if no admin exists yet,
        // or is a no-op if an admin is already registered.
        await actor.registerOrLogin();

        // Now check if this caller is actually the admin
        const isAdmin = await actor.isCallerAdmin();
        if (isAdmin) {
          setIsAdminAuthenticated(true);
        }
      } catch (err) {
        // Silently handle errors (e.g., anonymous principal)
      } finally {
        setIsInitializingAdmin(false);
      }
    })();
  }, [actor, actorFetching, isAuthenticated]);

  // Reset registration flag when identity changes (login/logout)
  useEffect(() => {
    registrationAttempted.current = false;
    if (!isAuthenticated) {
      // Clear admin state when user logs out (unless passcode session exists)
      const stored = localStorage.getItem(ADMIN_SESSION_KEY);
      if (!stored) {
        setIsAdminAuthenticated(false);
      }
    }
  }, [identity, isAuthenticated]);

  const login = useCallback(async (passcode: string): Promise<boolean> => {
    if (passcode !== ADMIN_PASSCODE) {
      return false;
    }

    const session: AdminSession = {
      authenticated: true,
      timestamp: Date.now(),
    };
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    setIsAdminAuthenticated(true);
    return true;
  }, []);

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
