import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  FormControlLabel,
  Switch,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import { listAdminServices, patchAdminService } from "../services/api/adminApi";
import type { AdminServiceResponse } from "../services/api/adminApi";

type SnackbarState = {
  open: boolean;
  severity: "success" | "error";
  message: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function AdminServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Service Configuration
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Enable and disable backend-registered services. Region and city
            availability is managed by pricing zones until a dedicated override
            contract is exposed.
          </Typography>
        </Box>
      </Box>
      <Box className="flex-1 flex flex-col gap-3">
        {children}
      </Box>
    </Box>
  );
}

export default function ServiceConfigurationPage() {
  const [services, setServices] = useState<AdminServiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingServiceId, setSavingServiceId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, severity: "success", message: "" });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminServices();
      setServices(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load services"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchServices();
  }, [fetchServices]);

  const handleServiceToggle = async (serviceId: string, enabled: boolean) => {
    setSavingServiceId(serviceId);
    try {
      const updated = await patchAdminService(serviceId, { enabled });
      setServices(prev => prev.map(s => s.id === serviceId ? updated : s));
      setSnackbar({
        open: true,
        severity: "success",
        message: `${updated.name} ${updated.enabled ? "enabled" : "disabled"}.`,
      });
    } catch (e) {
      setSnackbar({ open: true, severity: "error", message: getErrorMessage(e, "Failed to update service") });
    } finally {
      setSavingServiceId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" action={<ButtonLikeRetry onClick={() => void fetchServices()} />}>{error}</Alert>;
  }

  return (
    <AdminServicesLayout>
      <Card
        elevation={1}
        sx={{
          borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.5)",
        }}
      >
        <CardContent className="p-4 flex flex-col gap-3">
          <Typography
            variant="subtitle2"
            className="font-semibold mb-1"
          >
            Service toggles
          </Typography>
          <Typography
            variant="caption"
            className="text-[11px] text-slate-500"
          >
            These are global service switches. Use pricing zones to control geographic availability.
          </Typography>

          <Divider className="!my-2" />

          <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {services.map((service) => (
              <Card
                key={service.id}
                elevation={0}
                sx={{
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.5)",
                }}
              >
                <CardContent className="p-3 flex items-start justify-between gap-3">
                  <Box className="flex flex-col">
                    <Typography
                      variant="body2"
                      className="text-[13px] font-medium"
                    >
                      {service.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      className="text-[11px] text-slate-500 mt-0.5"
                    >
                      Key: {service.key}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={service.enabled}
                        disabled={savingServiceId === service.id}
                        onChange={(e) => void handleServiceToggle(service.id, e.target.checked)}
                      />
                    }
                    label=""
                    sx={{ marginLeft: 0 }}
                  />
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box className="flex items-center justify-between mt-2">
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Changes take effect immediately for new sessions.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((current) => ({ ...current, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }} onClose={() => setSnackbar((current) => ({ ...current, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminServicesLayout>
  );
}

function ButtonLikeRetry({ onClick }: { onClick: () => void }) {
  return (
    <Typography
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        border: 0,
        background: "transparent",
        color: "inherit",
        cursor: "pointer",
        font: "inherit",
        fontWeight: 700,
        p: 0,
      }}
    >
      Retry
    </Typography>
  );
}
