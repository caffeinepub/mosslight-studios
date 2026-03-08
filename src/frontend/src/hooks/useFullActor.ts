/**
 * useFullActor.ts
 *
 * A thin wrapper around useActor that casts the actor to FullBackendInterface.
 * This gives hooks access to all legacy backend methods (products, orders,
 * gallery, blog, etc.) that were dropped from the regenerated backend.d.ts.
 *
 * We use a cast rather than module augmentation because config.ts's Backend
 * class `implements backendInterface` and cannot be updated (read-only file).
 */

import type { FullBackendInterface } from "../backendTypes";
import { useActor } from "./useActor";

export function useFullActor() {
  const { actor, isFetching } = useActor();
  return {
    actor: actor as FullBackendInterface | null,
    isFetching,
  };
}
