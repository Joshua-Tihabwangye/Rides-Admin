import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import type { AlertColor } from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SecurityIcon from "@mui/icons-material/Security";
import KeyIcon from "@mui/icons-material/Key";
import RefreshIcon from "@mui/icons-material/Refresh";
import PageStateCard from "../components/PageStateCard";
import { getAuthRoles } from "../auth/auth";
import { hasPermissionByRoles } from "../auth/permissions";
import { createAdminRole, listAdminPermissions, listAdminRoles, patchAdminRole, type AdminRoleResponse } from "../services/api/adminApi";

const EV_GREEN = "#03cd8c";
type StatusState = { type: AlertColor; message: string } | null;
type NewRoleState = { name: string; description: string };
type PermissionOption = { value: string; group: string; label: string };

function titleCase(value: string) {
  return value
    .split(/[-_:]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function describePermission(value: string): PermissionOption {
  if (value === "*") return { value, group: "Platform", label: "All permissions" };
  const [group = "platform", ...rest] = value.split(":");
  return {
    value,
    group: titleCase(group),
    label: titleCase(rest.join(":") || value),
  };
}

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<AdminRoleResponse[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<NewRoleState>({ name: "", description: "" });
  const [status, setStatus] = useState<StatusState>(null);
  const [loading, setLoading] = useState(true);
  const [roleSearch, setRoleSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");

  const canManageRoles = hasPermissionByRoles(getAuthRoles(), "manage_roles");
  const selectedRole = useMemo(() => roles.find((role) => role.id === selectedRoleId) || roles[0], [roles, selectedRoleId]);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, permissionRows] = await Promise.all([listAdminRoles(), listAdminPermissions()]);
      setRoles(Array.isArray(rows) ? rows : []);
      setPermissions(Array.isArray(permissionRows) ? permissionRows : []);
      setSelectedRoleId((prev) => prev || rows[0]?.id || "");
      setStatus(null);
    } catch (error) {
      console.error("Failed to load admin roles", error);
      setStatus({ type: "error", message: "Failed to load roles from backend." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const permissionRows = useMemo(() => {
    const available = permissions.length ? permissions : selectedRole?.permissions || [];
    const query = permissionSearch.trim().toLowerCase();
    return available
      .map(describePermission)
      .filter((permission) => !query || [permission.group, permission.label, permission.value].join(" ").toLowerCase().includes(query))
      .sort((a, b) => `${a.group}:${a.label}`.localeCompare(`${b.group}:${b.label}`));
  }, [permissionSearch, permissions, selectedRole?.permissions]);

  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    return roles.filter((role) => !query || [role.name, role.description, role.id].join(" ").toLowerCase().includes(query));
  }, [roleSearch, roles]);

  const selectedPermissions = useMemo(() => new Set(selectedRole?.permissions || []), [selectedRole?.permissions]);
  const totalAssignments = roles.reduce((sum, role) => sum + (role.permissions || []).length, 0);

  const handleCreateRole = async () => {
    if (!canManageRoles) {
      setStatus({ type: "warning", message: "Your account cannot create or edit roles." });
      return;
    }
    const name = newRole.name.trim();
    if (!name) return;
    try {
      await createAdminRole({ name, description: newRole.description.trim() || undefined, permissions: [] });
      setCreateDialogOpen(false);
      setNewRole({ name: "", description: "" });
      setStatus({ type: "success", message: `Role ${name} created.` });
      await loadRoles();
    } catch (error) {
      console.error("Failed to create role", error);
      setStatus({ type: "error", message: "Failed to create role." });
    }
  };

  const handleTogglePermission = async (permission: string) => {
    if (!selectedRole || !canManageRoles) {
      setStatus({ type: "warning", message: "Your account cannot update role permissions." });
      return;
    }
    const current = new Set(selectedRole.permissions || []);
    if (current.has(permission)) current.delete(permission);
    else current.add(permission);
    try {
      await patchAdminRole(selectedRole.id, { permissions: Array.from(current).sort((a, b) => a.localeCompare(b)) });
      setStatus({ type: "success", message: `Permissions updated for ${selectedRole.name}.` });
      await loadRoles();
    } catch (error) {
      console.error("Failed to update role permissions", error);
      setStatus({ type: "error", message: "Failed to update permissions." });
    }
  };

  const handleDescriptionUpdate = async () => {
    if (!selectedRole || !canManageRoles) {
      setStatus({ type: "warning", message: "Your account cannot update role descriptions." });
      return;
    }
    try {
      await patchAdminRole(selectedRole.id, { description: selectedRole.description || "" });
      setStatus({ type: "success", message: "Role description saved." });
      await loadRoles();
    } catch (error) {
      console.error("Failed to save role description", error);
      setStatus({ type: "error", message: "Failed to save role description." });
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", pb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <AdminPanelSettingsIcon sx={{ color: EV_GREEN }} />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0 }}>Roles & Permissions</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Backend role definitions and permission assignments for admin access control.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => void loadRoles()} sx={{ borderRadius: 1, textTransform: "none" }}>Refresh</Button>
          <Button variant="contained" disabled={!canManageRoles} size="small" onClick={() => setCreateDialogOpen(true)} sx={{ borderRadius: 1, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>New role</Button>
        </Stack>
      </Box>

      {!canManageRoles ? <Alert severity="warning" sx={{ mb: 2 }}>This view is readable, but your account cannot change roles or permissions.</Alert> : null}
      {status ? <Alert severity={status.type} sx={{ mb: 2 }}>{status.message}</Alert> : null}

      {loading ? (
        <PageStateCard kind="loading" title="Loading roles" message="Fetching backend role definitions." />
      ) : status?.type === "error" && roles.length === 0 ? (
        <PageStateCard kind="error" title="Failed to load roles" message={status.message} actionLabel="Retry" onAction={() => void loadRoles()} />
      ) : roles.length === 0 ? (
        <PageStateCard kind="empty" title="No roles found" message="Create a backend role to start managing permission matrices." />
      ) : (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
            <MetricCard label="Roles" value={roles.length} icon={<AdminPanelSettingsIcon />} color="#2563eb" />
            <MetricCard label="Permissions" value={permissions.length} icon={<KeyIcon />} color={EV_GREEN} />
            <MetricCard label="Assignments" value={totalAssignments} icon={<SecurityIcon />} color="#f59e0b" />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "380px 1fr" }, gap: 3 }}>
            <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)", overflow: "hidden" }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Role Registry</Typography>
                <Typography variant="caption" color="text.secondary">{filteredRoles.length} roles shown</Typography>
                <TextField size="small" fullWidth value={roleSearch} onChange={(event) => setRoleSearch(event.target.value)} placeholder="Search roles" sx={{ mt: 1.5 }} />
              </Box>
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Role</TableCell>
                      <TableCell align="right">Permissions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRoles.map((role) => (
                      <TableRow key={role.id} hover selected={role.id === selectedRole?.id} onClick={() => setSelectedRoleId(role.id)} sx={{ cursor: "pointer" }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{role.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{role.description || "No description"}</Typography>
                        </TableCell>
                        <TableCell align="right"><Chip size="small" label={(role.permissions || []).length} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            <Stack spacing={2}>
              {selectedRole ? (
                <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)" }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{selectedRole.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{(selectedRole.permissions || []).length} enabled permissions</Typography>
                      </Box>
                      <TextField
                        size="small"
                        disabled={!canManageRoles}
                        value={selectedRole.description || ""}
                        onChange={(event) => setRoles((prev) => prev.map((role) => (role.id === selectedRole.id ? { ...role, description: event.target.value } : role)))}
                        label="Description"
                        sx={{ flex: 2 }}
                      />
                      <Button variant="contained" size="small" disabled={!canManageRoles} onClick={() => void handleDescriptionUpdate()} sx={{ borderRadius: 1, textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>
                        Save
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}

              <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)", overflow: "hidden" }}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Permission Matrix</Typography>
                  <Typography variant="caption" color="text.secondary">Toggle permissions for the selected role.</Typography>
                  <TextField size="small" fullWidth value={permissionSearch} onChange={(event) => setPermissionSearch(event.target.value)} placeholder="Search permissions" sx={{ mt: 1.5 }} />
                </Box>
                <Divider />
                <TableContainer sx={{ maxHeight: 620 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Permission</TableCell>
                        <TableCell>Key</TableCell>
                        <TableCell align="right">Enabled</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {permissionRows.map((permission) => {
                        const isEnabled = selectedPermissions.has(permission.value);
                        return (
                          <TableRow key={permission.value} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{permission.label}</Typography>
                              <Typography variant="caption" color="text.secondary">{permission.group}</Typography>
                            </TableCell>
                            <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{permission.value}</TableCell>
                            <TableCell align="right">
                              <Switch size="small" checked={isEnabled} disabled={!canManageRoles || !selectedRole} onChange={() => void handleTogglePermission(permission.value)} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Stack>
          </Box>
        </>
      )}

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField label="Role name" size="small" value={newRole.name} onChange={(event) => setNewRole((prev) => ({ ...prev, name: event.target.value }))} />
          <TextField label="Description" size="small" value={newRole.description} onChange={(event) => setNewRole((prev) => ({ ...prev, description: event.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button onClick={() => void handleCreateRole()} variant="contained" disabled={!canManageRoles} sx={{ textTransform: "none", bgcolor: EV_GREEN, "&:hover": { bgcolor: "#0fb589" } }}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function MetricCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card elevation={1} sx={{ borderRadius: 1, border: "1px solid rgba(148,163,184,0.45)" }}>
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
