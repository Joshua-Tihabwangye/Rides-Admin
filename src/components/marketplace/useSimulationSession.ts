import { useCallback, useEffect, useState } from "react";
import {
  createSimulationSession,
  listSimulationSessions,
  type SimulationSession,
} from "../../services/api/marketplaceApi";

const STORAGE_KEY = "evzone_admin_mkt_sim_session_id";

/**
 * UI-level holder for the active marketplace simulation session. The session
 * itself lives in PostgreSQL; only its id is remembered for navigation across
 * pages and reloads (never authoritative business data).
 */
export function useSimulationSession() {
  const [session, setSession] = useState<SimulationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const remembered = window.localStorage.getItem(STORAGE_KEY);
      const { items } = await listSimulationSessions();
      const active = items.find((item) => item.status === "ACTIVE");
      const chosen =
        (remembered ? items.find((item) => item.id === remembered && item.status === "ACTIVE") : undefined) ??
        active ??
        null;
      if (chosen) {
        window.localStorage.setItem(STORAGE_KEY, chosen.id);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      setSession(chosen);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load simulation sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const startSession = useCallback(
    async (input: { buyerUserId: string; sellerOrganizationId: string; merchantLocationId?: string }) => {
      setError(null);
      const created = await createSimulationSession(input);
      window.localStorage.setItem(STORAGE_KEY, created.id);
      setSession(created);
      return created;
    },
    [],
  );

  return { session, loading, error, startSession, reload: bootstrap };
}
