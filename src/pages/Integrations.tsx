// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Snackbar, Typography } from "@mui/material";
import { listAdminServices, patchAdminService } from "../services/api/adminApi";

function AdminIntegrationsLayout({ children }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">Integrations</Typography>
          <Typography variant="caption" color="text.secondary">Monitor and control backend service integrations.</Typography>
        </Box>
      </Box>
      <Box className="flex-1 flex flex-col gap-3">{children}</Box>
    </Box>
  );
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ open: false, message: "", severity: "info" });

  const load = async () => {
    setLoading(true);
    try {
      const rows = await listAdminServices();
      setIntegrations(rows);
    } catch (error) {
      console.error("Failed to load admin services", error);
      setFeedback({ open: true, message: "Failed to load integrations", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleToggle = async (integration) => {
    try {
      await patchAdminService(integration.id, { enabled: !integration.enabled });
      setFeedback({ open: true, message: `${integration.name || integration.key} updated`, severity: "success" });
      await load();
    } catch (error) {
      console.error("Failed to update integration", error);
      setFeedback({ open: true, message: "Failed to update integration", severity: "error" });
    }
  };

  return (
    <AdminIntegrationsLayout>
      <Snackbar open={feedback.open} autoHideDuration={4000} onClose={() => setFeedback({ ...feedback, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={() => setFeedback({ ...feedback, open: false })} severity={feedback.severity} sx={{ width: "100%" }}>{feedback.message}</Alert>
      </Snackbar>

      {loading ? (
        <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}><CardContent><Typography variant="body2" color="text.secondary">Loading integrations...</Typography></CardContent></Card>
      ) : (
        <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {integrations.map((integration) => (
            <Card key={integration.id} elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
              <CardContent className="p-4 flex flex-col gap-2">
                <Box className="flex items-center justify-between gap-2">
                  <Box>
                    <Typography variant="subtitle2" className="font-semibold">{integration.name || integration.key}</Typography>
                    <Typography variant="caption" className="text-[11px] text-slate-500">Key: {integration.key}</Typography>
                  </Box>
                  <Chip size="small" label={integration.enabled ? "Connected" : "Disconnected"} color={integration.enabled ? "success" : "default"} sx={{ fontSize: 10, height: 22 }} />
                </Box>
                <Divider className="!my-1" />
                <Typography variant="caption" className="text-[11px] text-slate-500">{integration.description || "No description"}</Typography>
                <Box className="flex justify-end mt-1">
                  <Button variant="outlined" size="small" sx={{ textTransform: "none", borderRadius: 999, fontSize: 11 }} onClick={() => void handleToggle(integration)}>
                    {integration.enabled ? "Disable" : "Enable"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </AdminIntegrationsLayout>
  );
}
