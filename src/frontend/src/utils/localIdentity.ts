import { Ed25519KeyIdentity } from "@dfinity/identity";

const LOCAL_IDENTITY_KEY = "mosslight_local_identity";

export function getOrCreateLocalIdentity(): Ed25519KeyIdentity {
  try {
    const stored = localStorage.getItem(LOCAL_IDENTITY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Ed25519KeyIdentity.fromJSON(JSON.stringify(parsed));
    }
  } catch {
    // Fall through
  }
  const identity = Ed25519KeyIdentity.generate();
  try {
    localStorage.setItem(LOCAL_IDENTITY_KEY, JSON.stringify(identity.toJSON()));
  } catch {
    // Storage unavailable
  }
  return identity;
}
