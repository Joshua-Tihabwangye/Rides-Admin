// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  getAdminSystemOverview,
  listAdminAuditEvents,
  listAdminFeatureFlags,
  listAdminServices,
  type AdminAuditEventResponse,
  type AdminFeatureFlagResponse,
  type AdminServiceResponse,
} from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

type SystemOverviewState = {
  totals: { users: number; riders: number; drivers: number; trips: number };
  queues: { approvals: number; riskCases: number; safetyIncidents: number };
};

export default function SystemOverviewPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<SystemOverviewState | null>(null);
  const [services, setServices] = useState<AdminServiceResponse[]>([]);
  const [flags, setFlags] = useState<AdminFeatureFlagResponse[]>([]);
  const [audits, setAudits] = useState<AdminAuditEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ov, liveServices, liveFlags, liveAudits] = await Promise.all([
          getAdminSystemOverview(),
          listAdminServices(),
          listAdminFeatureFlags(),
          listAdminAuditEvents(),
        ]);
        if (cancelled) return;
        setOverview(ov);
        setServices(liveServices);
        setFlags(liveFlags);
        setAudits(liveAudits);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message ?? "Failed to load system overview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const routeMap = useMemo(
    () => ({
      integrations: "/admin/system/integrations",
      flags: "/admin/system/flags",
      audit: "/admin/system/audit-log",
      risk: "/admin/risk",
    }),
    [],
  );

  const activeServices = services.filter((service) => service.enabled).length;
  const disabledServices = services.length - activeServices;
  const enabledFlags = flags.filter((flag) => flag.enabled).length;
  const latestAudits = audits.slice(0, 6);
  const serviceHealth = services.length === 0 ? "No live services" : disabledServices > 0 ? "Needs attention" : "Operational";

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2 flex-wrap">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            System Health & Config Overview
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Live service, flag and audit summaries from the backend.
          </Typography>
        </Box>
        <Chip
          size="small"
          label={serviceHealth}
          sx={{
            bgcolor: disabledServices > 0 ? "#fef3c7" : "#dcfce7",
            borderColor: disabledServices > 0 ? "#fbbf24" : "#86efac",
            borderWidth: 1,
            borderStyle: "solid",
            color: "text.primary",
            fontSize: 10,
          }}
        />
      </Box>

      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <MetricCard label="Users" value={overview?.totals.users ?? 0} note="Live backend count" />
        <MetricCard label="Trips" value={overview?.totals.trips ?? 0} note="Current platform volume" />
        <MetricCard label="Active services" value={activeServices} note={`${disabledServices} disabled`} />
        <MetricCard label="Enabled flags" value={enabledFlags} note={`${flags.length} total`} />
      </Box>

      <Box className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)" }}>
          <CardContent className="p-4 flex flex-col gap-2">
            <Box className="flex items-center justify-between">
              <Typography variant="subtitle2" className="font-semibold" color="text.primary">
                Services
              </Typography>
              <Button variant="text" size="small" onClick={() => navigate(routeMap.integrations)} sx={{ textTransform: "none", fontSize: 11 }}>
                Manage
              </Button>
            </Box>
            <Divider className="!my-1" />
            <Stack spacing={1}>
              {services.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No live services returned from the backend.
                </Typography>
              ) : (
                services.map((service) => (
                  <Box key={service.id} className="flex items-center justify-between gap-2">
                    <Box>
                      <Typography variant="body2" className="font-semibold" color="text.primary">
                        {service.name}
                      </Typography>
                      <Typography variant="caption" className="text-[11px]" color="text.secondary">
                        {service.key}
                      </Typography>
                    </Box>
                    <Chip
                      label={service.enabled ? "Enabled" : "Disabled"}
                      size="small"
                      color={service.enabled ? "success" : "default"}
                      sx={{ fontSize: 9, height: 20 }}
                    />
                  </Box>
                ))
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)" }}>
          <CardContent className="p-4 flex flex-col gap-2">
            <Box className="flex items-center justify-between">
              <Typography variant="subtitle2" className="font-semibold" color="text.primary">
                Recent critical actions
              </Typography>
              <Button variant="text" size="small" onClick={() => navigate(routeMap.audit)} sx={{ textTransform: "none", fontSize: 11 }}>
                Open audit log
              </Button>
            </Box>
            <Divider className="!my-1" />
            <Stack spacing={1}>
              {latestAudits.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No recent audit entries returned.
                </Typography>
              ) : (
                latestAudits.map((audit) => (
                  <Box key={audit.id} className="p-2 rounded-md border border-divider">
                    <Typography variant="body2" className="font-semibold" color="text.primary">
                      {audit.action}
                    </Typography>
                    <Typography variant="caption" className="text-[11px]" color="text.secondary">
                      {audit.resource} · {audit.resourceId || "n/a"} · actor {audit.actorId}
                    </Typography>
                  </Box>
                ))
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)" }}>
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography variant="subtitle2" className="font-semibold" color="text.primary">
              Quick links
            </Typography>
            <Divider className="!my-1" />
            <Stack spacing={1}>
              <QuickLink label="Integrations" onClick={() => navigate(routeMap.integrations)} />
              <QuickLink label="Feature flags" onClick={() => navigate(routeMap.flags)} />
              <QuickLink label="Audit log" onClick={() => navigate(routeMap.audit)} />
              <QuickLink label="Risk desk" onClick={() => navigate(routeMap.risk)} />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

function MetricCard({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)" }}>
      <CardContent className="p-3">
        <Typography variant="caption" className="text-[11px] uppercase text-slate-500">
          {label}
        </Typography>
        <Typography variant="h6" className="font-semibold text-lg" color="text.primary">
          {value.toLocaleString()}
        </Typography>
        <Typography variant="caption" className="text-[11px]" sx={{ color: "success.main" }}>
          {note}
        </Typography>
      </CardContent>
    </Card>
  );
}

function QuickLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      sx={{
        justifyContent: "space-between",
        textTransform: "none",
        borderRadius: 2,
      }}
    >
      {label}
    </Button>
  );
}
