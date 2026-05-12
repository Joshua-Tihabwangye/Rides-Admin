import React, { useState, useEffect } from"react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  CircularProgress,
} from"@mui/material";
import { listAdminServices, patchAdminService } from"../services/api/adminApi";
import type { AdminServiceResponse } from"../services/api/adminApi";

const EV_COLORS = {
  primary:"#03cd8c",
  secondary:"#f77f00",
};

type ServiceConfig = {
  [country: string]: {
    [city: string]: {
      ride: boolean;
      delivery: boolean;
      rental: boolean;
      school: boolean;
      tours: boolean;
      ems: boolean;
    };
  };
};

function AdminServicesLayout({ children }) {
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
            Enable and disable services per country and city. This drives what
            appears in the Rider and Driver apps.
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
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminServices();
      setServices(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleServiceToggle = async (serviceId: string, enabled: boolean) => {
    try {
      await patchAdminService(serviceId, { enabled });
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, enabled } : s));
    } catch (e: any) {
      console.error("Failed to update service:", e);
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
    return <Alert severity="error">{error}</Alert>;
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
            Enable or disable services globally. Per-country/city overrides can be configured separately.
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
                        onChange={(e) => handleServiceToggle(service.id, e.target.checked)}
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

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity="success" sx={{ width: '100%' }}>
          Configuration saved successfully
        </Alert>
      </Snackbar>
    </AdminServicesLayout>
  );
}
