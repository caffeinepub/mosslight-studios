import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useFullActor } from "./useFullActor";

const ADMIN_PASSCODE = "09131991";
const ADMIN_SESSION_KEY = "adminSession";
const SESSION_DURATION = 24 * 60 * 60 * 1000;

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
  const { actor } = useFullActor();

  // Check for existing valid session on mount
  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_SESSION_KEY);
    if (stored) {
      try {
        const session: AdminSession = JSON.parse(stored);
        const isValid =
          session.authenticated &&
          Date.now() - session.timestamp < SESSION_DURATION;
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

  // When actor becomes available and we have a valid session, re-register with backend
  useEffect(() => {
    if (!actor || !isAdminAuthenticated) return;
    setIsInitializingAdmin(true);
    actor
      .adminLoginWithPasscode(ADMIN_PASSCODE)
      .catch(() => {})
      .finally(() => setIsInitializingAdmin(false));
  }, [actor, isAdminAuthenticated]);

  const login = useCallback(
    async (passcode: string): Promise<boolean> => {
      if (passcode !== ADMIN_PASSCODE) {
        return false;
      }

      // Register with backend
      if (actor) {
        try {
          const success = await actor.adminLoginWithPasscode(passcode);
          if (!success) {
            return false;
          }
        } catch {
          // Backend call failed but continue - local session still works
        }
      }

      const session: AdminSession = {
        authenticated: true,
        timestamp: Date.now(),
      };
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      setIsAdminAuthenticated(true);
      return true;
    },
    [actor],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdminAuthenticated(false);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{ isAdminAuthenticated, isInitializingAdmin, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
