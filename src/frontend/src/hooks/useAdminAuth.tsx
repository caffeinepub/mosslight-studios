import { Ed25519KeyIdentity } from "@dfinity/identity";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createActorWithConfig } from "../config";

const ADMIN_PASSCODE = "09131991";
const ADMIN_SESSION_KEY = "adminSession";
const ADMIN_IDENTITY_SEED_KEY = "adminIdentitySeed";
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

function getOrCreateAdminSeed(): Uint8Array {
  const stored = localStorage.getItem(ADMIN_IDENTITY_SEED_KEY);
  if (stored) {
    const bytes = new Uint8Array(
      stored.match(/.{1,2}/g)!.map((b) => Number.parseInt(b, 16)),
    );
    return bytes;
  }
  const seed = crypto.getRandomValues(new Uint8Array(32));
  const hex = Array.from(seed)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  localStorage.setItem(ADMIN_IDENTITY_SEED_KEY, hex);
  return seed;
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isInitializingAdmin, setIsInitializingAdmin] = useState(false);

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
          localStorage.removeItem(ADMIN_IDENTITY_SEED_KEY);
        }
      } catch {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        localStorage.removeItem(ADMIN_IDENTITY_SEED_KEY);
      }
    }
  }, []);

  const login = useCallback(async (passcode: string): Promise<boolean> => {
    if (passcode !== ADMIN_PASSCODE) {
      return false;
    }

    // Generate or retrieve persistent identity seed
    const seed = getOrCreateAdminSeed();
    const identity = Ed25519KeyIdentity.generate(seed);

    // Create an actor using this identity so backend recognizes us
    try {
      setIsInitializingAdmin(true);
      const adminActor = await createActorWithConfig({
        agentOptions: { identity },
      });
      const success = await adminActor.adminLoginWithPasscode(passcode);
      if (!success) {
        localStorage.removeItem(ADMIN_IDENTITY_SEED_KEY);
        setIsInitializingAdmin(false);
        return false;
      }
    } catch (err) {
      console.warn("Backend admin login failed:", err);
      // If backend call fails, still allow local session so UI works
    } finally {
      setIsInitializingAdmin(false);
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
    localStorage.removeItem(ADMIN_IDENTITY_SEED_KEY);
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
