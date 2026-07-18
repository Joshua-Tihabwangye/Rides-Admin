// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Snackbar,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  createAdminTrainingModule,
  deleteAdminTrainingModule,
  listAdminTrainingModules,
  patchAdminTrainingModule,
  type AdminTrainingModuleResponse,
} from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function backendStatusToUi(status: AdminTrainingModuleResponse["status"]) {
  if (status === "published") return "Published";
  if (status === "archived") return "Archived";
  return "Draft";
}

function uiStatusToBackend(status: string) {
  if (status === "Published") return "published";
  if (status === "Archived") return "archived";
  return "draft";
}

function encodeContent(module) {
  return JSON.stringify({
    description: module.description,
    audience: module.audience,
    language: module.language,
  });
}

function decodeContent(content) {
  if (!content) {
    return { description: "", audience: "Drivers", language: "en" };
  }

  try {
    const parsed = JSON.parse(content);
    return {
      description: typeof parsed.description === "string" ? parsed.description : content,
      audience: typeof parsed.audience === "string" ? parsed.audience : "Drivers",
      language: typeof parsed.language === "string" ? parsed.language : "en",
    };
  } catch {
    return { description: content, audience: "Drivers", language: "en" };
  }
}

function mapBackendModule(module) {
  const decoded = decodeContent(module.content);
  return {
    id: module.id,
    title: module.title,
    audience: decoded.audience || module.category || "Drivers",
    status: backendStatusToUi(module.status),
    language: decoded.language,
    description: decoded.description,
  };
}

function mapUiModuleToBackend(module) {
  return {
    title: module.title,
    category: module.audience,
    status: uiStatusToBackend(module.status),
    content: encodeContent(module),
  };
}

function AdminTrainingLayout({ children }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Global Training Manager
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Create and manage training modules for Drivers, Agents and Companies across regions.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3" sx={{ maxWidth: { lg: "100%" }, width: "100%" }}>
        {children}
      </Box>
    </Box>
  );
}

export default function GlobalTrainingManagerPage() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState({
    id: "",
    title: "",
    audience: "Drivers",
    status: "Draft",
    language: "en",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const backendModules = await listAdminTrainingModules();
        if (!active) return;
        const mapped = backendModules.map(mapBackendModule);
        setModules(mapped);
        setSelectedId((prev) => (prev && mapped.some((module) => module.id === prev) ? prev : mapped[0]?.id ?? null));
        setEditing((prev) => mapped.find((module) => module.id === (selectedId || prev.id)) || mapped[0] || prev);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load training modules");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedId) || modules[0] || null,
    [modules, selectedId],
  );

  const persistLocalCache = (nextModules) => {
    setModules(nextModules);
  };

  const handleRowClick = (module) => {
    setSelectedId(module.id);
    setEditing({ ...module });
  };

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setEditing((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewModule = () => {
    const draft = {
      id: "",
      title: "",
      audience: "Drivers",
      status: "Draft",
      language: "en",
      description: "",
    };
    setSelectedId(null);
    setEditing(draft);
  };

  const handleDelete = async () => {
    if (!selectedModule) return;
    setSaving(true);
    try {
      await deleteAdminTrainingModule(selectedModule.id);
      const nextModules = modules.filter((module) => module.id !== selectedModule.id);
      persistLocalCache(nextModules);
      setSelectedId(nextModules[0]?.id ?? null);
      setEditing(nextModules[0] ? { ...nextModules[0] } : {
        id: "",
        title: "",
        audience: "Drivers",
        status: "Draft",
        language: "en",
        description: "",
      });
      setSnackbar({ open: true, message: "Training module deleted.", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: err?.message || "Failed to delete module", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!editing.title.trim()) return;
    setSaving(true);
    try {
      if (!editing.id) {
        const created = await createAdminTrainingModule(mapUiModuleToBackend(editing));
        const nextModule = mapBackendModule(created);
        const nextModules = [...modules, nextModule];
        persistLocalCache(nextModules);
        setSelectedId(nextModule.id);
        setEditing(nextModule);
        setSnackbar({ open: true, message: "Training module created.", severity: "success" });
      } else {
        const updated = await patchAdminTrainingModule(editing.id, mapUiModuleToBackend(editing));
        const nextModule = mapBackendModule(updated);
        const nextModules = modules.map((module) => (module.id === nextModule.id ? nextModule : module));
        persistLocalCache(nextModules);
        setSelectedId(nextModule.id);
        setEditing(nextModule);
        setSnackbar({ open: true, message: "Training module updated.", severity: "success" });
      }
    } catch (err) {
      setSnackbar({ open: true, message: err?.message || "Failed to save module", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Loading training modules...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <AdminTrainingLayout>
      <Box className="flex flex-col lg:flex-row gap-4" sx={{ width: "100%", maxWidth: "100%" }}>
        <Card
          elevation={1}
          sx={{
            flex: 1,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Box className="flex items-center justify-between gap-2">
              <Typography variant="subtitle2" className="font-semibold">
                Modules
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  fontSize: 11,
                }}
                onClick={handleNewModule}
              >
                + New module
              </Button>
            </Box>
            <Divider className="!my-1" />

            <TableContainer component={Box}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "action.hover" }}>
                    <TableCell>Title</TableCell>
                    <TableCell>Audience</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Language</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow
                      key={module.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      selected={module.id === selectedId}
                      onClick={() => handleRowClick(module)}
                    >
                      <TableCell>{module.title}</TableCell>
                      <TableCell>{module.audience}</TableCell>
                      <TableCell>{module.status}</TableCell>
                      <TableCell>{module.language}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="caption" className="text-[11px] text-slate-500 mt-1">
              Training modules are persisted in the backend and mirrored into rider, driver, and admin surfaces by audience.
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={1}
          sx={{
            flex: 1.3,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography variant="subtitle2" className="font-semibold">
              Module editor
            </Typography>
            <Divider className="!my-1" />

            <Box className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Box className="flex flex-col gap-1">
                <Typography variant="caption" className="text-[11px] text-slate-500">
                  Title
                </Typography>
                <TextField size="small" fullWidth value={editing.title} onChange={handleFieldChange("title")} />
              </Box>
              <Box className="flex flex-col gap-1">
                <Typography variant="caption" className="text-[11px] text-slate-500">
                  Audience
                </Typography>
                <Select size="small" fullWidth value={editing.audience} onChange={handleFieldChange("audience")}>
                  <MenuItem value="Drivers">Drivers</MenuItem>
                  <MenuItem value="Agents">Agents</MenuItem>
                  <MenuItem value="Companies">Companies</MenuItem>
                </Select>
              </Box>
              <Box className="flex flex-col gap-1">
                <Typography variant="caption" className="text-[11px] text-slate-500">
                  Status
                </Typography>
                <Select size="small" fullWidth value={editing.status} onChange={handleFieldChange("status")}>
                  <MenuItem value="Draft">Draft</MenuItem>
                  <MenuItem value="Published">Published</MenuItem>
                  <MenuItem value="Archived">Archived</MenuItem>
                </Select>
              </Box>
              <Box className="flex flex-col gap-1">
                <Typography variant="caption" className="text-[11px] text-slate-500">
                  Language
                </Typography>
                <Select size="small" fullWidth value={editing.language} onChange={handleFieldChange("language")}>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="sw">Swahili</MenuItem>
                </Select>
              </Box>
            </Box>

            <Box className="flex flex-col gap-1">
              <Typography variant="caption" className="text-[11px] text-slate-500">
                Description
              </Typography>
              <TextField
                size="small"
                multiline
                fullWidth
                minRows={3}
                maxRows={5}
                value={editing.description}
                onChange={handleFieldChange("description")}
              />
            </Box>

            <Box className="flex items-center justify-between mt-4 border-t pt-4">
              <Button
                variant="outlined"
                size="small"
                disabled={!selectedModule || saving}
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  fontSize: 12,
                }}
                onClick={handleDelete}
              >
                Delete module
              </Button>
              <Box className="flex items-center gap-2">
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    textTransform: "none",
                    bgcolor: EV_COLORS.secondary,
                    color: "white",
                    "&:hover": {
                      bgcolor: "#d97706",
                    },
                  }}
                  onClick={() => {
                    if (!editing.title) return;
                    navigate(`/admin/training/preview?title=${encodeURIComponent(editing.title)}&desc=${encodeURIComponent(editing.description)}`);
                  }}
                >
                  View as User
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  disabled={saving}
                  sx={{
                    textTransform: "none",
                    borderRadius: 999,
                    fontSize: 12,
                    bgcolor: EV_COLORS.primary,
                    "&:hover": { bgcolor: "#0fb589" },
                  }}
                  onClick={() => void handleSave()}
                >
                  {saving ? "Saving..." : "Save module"}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminTrainingLayout>
  );
}
