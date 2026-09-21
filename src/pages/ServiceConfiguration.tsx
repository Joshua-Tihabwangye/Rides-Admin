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
  FormControlLabel,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import { listAdminServices, patchAdminService } from "../services/api/adminApi";
import type { AdminServiceResponse } from "../services/api/adminApi";

const EV_GREEN = "#03cd8c";

type SnackbarState = {
  open: boolean;
  severity: "success" | "error";
  message: string;
};

type ServiceFilter = "all" | "enabled" | "disabled";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(value?: number) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

export default function ServiceConfigurationPage() {
  const [services, setServices] = useState<AdminServiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingServiceId, setSavingServiceId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ServiceFilter>("all");
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, severity: "success", message: "" });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load services"));
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchServices();
  }, [fetchServices]);

  const enabledCount = useMemo(() => services.filter((service) => service.enabled).length, [services]);
  const disabledCount = services.length - enabledCount;

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return services.filter((service) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "enabled" && service.enabled) ||
        (filter === "disabled" && !service.enabled);
      const haystack = [service.name, service.key, service.description].join(" ").toLowerCase();
      return matchesFilter && (!query || haystack.includes(query));
    });
  }, [filter, search, services]);

  const handleServiceToggle = async (serviceId: string, enabled: boolean) => {
    setSavingServiceId(serviceId);
    try {
      const updated = await patchAdminService(serviceId, { enabled });
      setServices((prev) => prev.map((service) => (service.id === serviceId ? updated : service)));
      setSnackbar({
        open: true,
        severity: "success",
        message: `${updated.name} ${updated.enabled ? "enabled" : "disabled"}.`,
      });
    } catch (err) {
      setSnackbar({ open: true, severity: "error", message: getErrorMessage(err, "Failed to update service") });
    } finally {
      setSavingServiceId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", pb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <SettingsSuggestIcon sx={{ color: EV_GREEN }} />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0 }}>Service Configuration</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Backend-registered service switches used by riders, drivers, dispatch, and pricing.
          </Typography>
        </Box>
        <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => void fetchServices()} sx={{ borderRadius: 1, textTransform: "none" }}>
          Refresh
        </Button>
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
        <MetricCard label="All services" value={services.length} icon={<SettingsSuggestIcon />} active={filter === "all"} onClick={() => setFilter("all")} />
        <MetricCard label="Enabled" value={enabledCount} icon={<ToggleOnIcon />} active={filter === "enabled"} onClick={() => setFilter("enabled")} tone="success" />
        <MetricCard label="Disabled" value={disabledCount} icon={<ToggleOffIcon />} active={filter === "disabled"} onClick={() => setFilter("disabled")} tone="muted" />
      </Box>

      <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)", mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search services by name, key, or description"
          />
        </CardContent>
      </Card>

      <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)", overflow: "hidden" }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Service Registry</Typography>
          <Typography variant="caption" color="text.secondary">{filteredServices.length} of {services.length} backend services shown</Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Service</TableCell>
                <TableCell>Key</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last updated</TableCell>
                <TableCell align="right">Global switch</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>No services match this view</Typography>
                    <Typography variant="body2" color="text.secondary">Clear the search or choose another status filter.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service) => (
                  <TableRow key={service.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{service.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{service.description || "No backend description provided"}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{service.key}</TableCell>
                    <TableCell>
                      <Chip size="small" color={service.enabled ? "success" : "default"} label={service.enabled ? "Enabled" : "Disabled"} />
                    </TableCell>
                    <TableCell>{formatDate(service.updatedAt || service.createdAt)}</TableCell>
                    <TableCell align="right">
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={service.enabled}
                            disabled={savingServiceId === service.id}
                            onChange={(event) => void handleServiceToggle(service.id, event.target.checked)}
                          />
                        }
                        label=""
                        sx={{ m: 0 }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((current) => ({ ...current, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: "100%" }} onClose={() => setSnackbar((current) => ({ ...current, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function MetricCard({
  label,
  value,
  icon,
  active,
  tone = "default",
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  active?: boolean;
  tone?: "default" | "success" | "muted";
  onClick: () => void;
}) {
  const color = tone === "success" ? EV_GREEN : tone === "muted" ? "#64748b" : "#2563eb";
  return (
    <Card
      elevation={active ? 2 : 1}
      onClick={onClick}
      sx={{
        borderRadius: 1,
        border: `1px solid ${active ? color : "rgba(148,163,184,0.45)"}`,
        cursor: "pointer",
        bgcolor: active ? `${color}10` : "background.paper",
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 1, bgcolor: `${color}18`, color }}>{icon}</Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: "uppercase" }}>{label}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>{value.toLocaleString()}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
