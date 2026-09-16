import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  getAdminIntegrationsHealth,
  type AdminIntegrationHealthResponse,
} from "../services/api/adminApi";

function AdminIntegrationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Integrations
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Monitor backend integration health from the authoritative Admin API.
          </Typography>
        </Box>
      </Box>
      <Box className="flex-1 flex flex-col gap-3">{children}</Box>
    </Box>
  );
}

function formatDate(value: AdminIntegrationHealthResponse["generatedAt"] | undefined) {
  if (!value) return "Unknown";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function recordText(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return null;
}

function HealthCard({
  title,
  status,
  statusColor,
  children,
}: {
  title: string;
  status: string;
  statusColor: "success" | "warning" | "error" | "default";
  children: React.ReactNode;
}) {
  return (
    <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
      <CardContent className="p-4 flex flex-col gap-2">
        <Box className="flex items-center justify-between gap-2">
          <Typography variant="subtitle2" className="font-semibold">
            {title}
          </Typography>
          <Chip size="small" label={status} color={statusColor} sx={{ fontSize: 10, height: 22 }} />
        </Box>
        <Divider className="!my-1" />
        {children}
      </CardContent>
    </Card>
  );
}

export default function IntegrationsPage() {
  const [health, setHealth] = useState<AdminIntegrationHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHealth(await getAdminIntegrationsHealth());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load integration health");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const outboxStatus = useMemo(() => {
    if (!health) return { label: "Unknown", color: "default" as const };
    if (health.outbox.failed > 0) return { label: "Attention", color: "error" as const };
    if (health.outbox.pending > 0) return { label: "Pending", color: "warning" as const };
    return { label: "Healthy", color: "success" as const };
  }, [health]);

  const dispatchStatus = useMemo(() => {
    if (!health) return { label: "Unknown", color: "default" as const };
    if (health.dispatch.desks === 0 || health.dispatch.agents === 0) {
      return { label: "Incomplete", color: "warning" as const };
    }
    return { label: "Available", color: "success" as const };
  }, [health]);

  return (
    <AdminIntegrationsLayout>
      <Box className="flex items-center justify-between gap-2">
        <Typography variant="caption" color="text.secondary">
          Last checked: {formatDate(health?.generatedAt)}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => void load()}
          disabled={loading}
          sx={{ textTransform: "none", borderRadius: 999, fontSize: 11 }}
        >
          Refresh
        </Button>
      </Box>

      {error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void load()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Loading integration health...
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : health ? (
        <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <HealthCard
            title="School connections"
            status={health.schoolConnections.length > 0 ? "Configured" : "None"}
            statusColor={health.schoolConnections.length > 0 ? "success" : "default"}
          >
            <Typography variant="body2" color="text.primary" fontWeight={800}>
              {health.schoolConnections.length} connection{health.schoolConnections.length === 1 ? "" : "s"}
            </Typography>
            {health.schoolConnections.length > 0 ? (
              <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                {health.schoolConnections.slice(0, 4).map((connection, index) => (
                  <Box key={recordText(connection, ["id", "schoolId", "name"]) ?? index}>
                    <Typography variant="caption" sx={{ display: "block", fontWeight: 800 }}>
                      {recordText(connection, ["schoolName", "name", "schoolId", "id"]) ?? `Connection ${index + 1}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Updated: {formatDate(recordText(connection, ["updatedAt", "createdAt"]) ?? undefined)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="caption" color="text.secondary">
                The backend reported no school integrations.
              </Typography>
            )}
          </HealthCard>

          <HealthCard title="Integration outbox" status={outboxStatus.label} statusColor={outboxStatus.color}>
            <Typography variant="body2" color="text.primary" fontWeight={800}>
              {health.outbox.pending} pending
            </Typography>
            <Typography variant="body2" color={health.outbox.failed > 0 ? "error.main" : "text.secondary"}>
              {health.outbox.failed} failed
            </Typography>
          </HealthCard>

          <HealthCard title="Dispatch infrastructure" status={dispatchStatus.label} statusColor={dispatchStatus.color}>
            <Typography variant="body2" color="text.primary" fontWeight={800}>
              {health.dispatch.desks} dispatch desk{health.dispatch.desks === 1 ? "" : "s"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {health.dispatch.agents} agent{health.dispatch.agents === 1 ? "" : "s"}
            </Typography>
          </HealthCard>
        </Box>
      ) : (
        <Alert severity="info">No integration health data was returned by the backend.</Alert>
      )}
    </AdminIntegrationsLayout>
  );
}
