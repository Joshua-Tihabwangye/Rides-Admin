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
import PageStateCard from "../components/PageStateCard";
import { getAuthRoles } from "../auth/auth";
import { hasPermissionByRoles } from "../auth/permissions";
import { createAdminRole, listAdminPermissions, listAdminRoles, patchAdminRole, type AdminRoleResponse } from "../services/api/adminApi";

type StatusState = { type: AlertColor; message: string } | null;
type NewRoleState = { name: string; description: string };
type PermissionOption = { value: string; group: string; label: string };

function AdminRolesLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">Roles & Permissions</Typography>
          <Typography variant="caption" color="text.secondary">Manage backend role definitions and permissions.</Typography>
        </Box>
      </Box>
      <Box className="flex-1 flex flex-col gap-3">{children}</Box>
    </Box>
  );
}

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

function RoleMatrix({
  role,
  permissions,
  onToggle,
  disabled,
}: {
  role: AdminRoleResponse;
  permissions: string[];
  onToggle: (permission: string) => void;
  disabled: boolean;
}) {
  const permissionRows = useMemo(() => {
    const available = permissions.length ? permissions : role.permissions || [];
    return available.map(describePermission).sort((a, b) => `${a.group}:${a.label}`.localeCompare(`${b.group}:${b.label}`));
  }, [permissions, role.permissions]);
  const enabled = useMemo(() => new Set(role.permissions || []), [role.permissions]);
  let lastGroup = "";

  return (
    <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.6)" }}>
      <CardContent className="p-3 flex flex-col gap-2">
        <Typography variant="subtitle2" className="font-semibold mb-1">Permissions – {role?.name || "-"}</Typography>
        <Box className="overflow-x-auto">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Permission</TableCell>
                <TableCell>Key</TableCell>
                <TableCell align="right">Enabled</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {permissionRows.map((permission) => {
                const showGroup = permission.group !== lastGroup;
                lastGroup = permission.group;
                const isEnabled = enabled.has(permission.value);
                return (
                  <React.Fragment key={permission.value}>
                    {showGroup ? (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ bgcolor: "action.hover", fontWeight: 700 }}>
                          {permission.group}
                        </TableCell>
                      </TableRow>
                    ) : null}
                    <TableRow hover>
                      <TableCell>{permission.label}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{permission.value}</TableCell>
                      <TableCell align="right">
                        <Button size="small" disabled={disabled} variant={isEnabled ? "contained" : "outlined"} onClick={() => onToggle(permission.value)}>
                          {isEnabled ? "Enabled" : "Enable"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<AdminRoleResponse[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<NewRoleState>({ name: "", description: "" });
  const [status, setStatus] = useState<StatusState>(null);
  const [loading, setLoading] = useState(true);

  const canManageRoles = hasPermissionByRoles(getAuthRoles(), "manage_roles");
  const selectedRole = useMemo(() => roles.find((role) => role.id === selectedRoleId) || roles[0], [roles, selectedRoleId]);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, permissionRows] = await Promise.all([listAdminRoles(), listAdminPermissions()]);
      setRoles(rows);
      setPermissions(permissionRows);
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
    if (current.has(permission)) {
      current.delete(permission);
    } else {
      current.add(permission);
    }
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
    <AdminRolesLayout>
      {!canManageRoles ? <Alert severity="warning">This view is readable, but your account cannot change roles or permissions.</Alert> : null}
      {status && <Alert severity={status.type}>{status.message}</Alert>}

      {loading ? (
        <PageStateCard kind="loading" title="Loading roles" message="Fetching backend role definitions." />
      ) : status?.type === "error" && roles.length === 0 ? (
        <PageStateCard kind="error" title="Failed to load roles" message={status.message} actionLabel="Retry" onAction={() => void loadRoles()} />
      ) : roles.length === 0 ? (
        <PageStateCard kind="empty" title="No roles found" message="Create a backend role to start managing permission matrices." actionLabel={canManageRoles ? "Reload" : undefined} onAction={canManageRoles ? () => void loadRoles() : undefined} />
      ) : (
        <Box className="flex flex-col lg:flex-row gap-4">
          <Card elevation={1} sx={{ flex: 1, borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
            <CardContent className="p-4 flex flex-col gap-3">
              <Box className="flex items-center justify-between gap-2">
                <Typography variant="subtitle2" className="font-semibold">Roles</Typography>
                <Button variant="outlined" disabled={!canManageRoles} size="small" sx={{ textTransform: "none", borderRadius: 999, fontSize: 11 }} onClick={() => setCreateDialogOpen(true)}>+ New role</Button>
              </Box>
              <Divider className="!my-1" />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "action.hover" }}>
                      <TableCell>Role</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Permissions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id} hover selected={role.id === selectedRoleId} onClick={() => setSelectedRoleId(role.id)} sx={{ cursor: "pointer" }}>
                        <TableCell>{role.name}</TableCell>
                        <TableCell>{role.description || "-"}</TableCell>
                        <TableCell align="right"><Chip size="small" label={(role.permissions || []).length} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Box sx={{ flex: 2 }} className="flex flex-col gap-3">
            {selectedRole && (
              <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
                <CardContent className="p-4 flex flex-col gap-2">
                  <Typography variant="subtitle2" className="font-semibold">{selectedRole.name}</Typography>
                  <TextField size="small" disabled={!canManageRoles} value={selectedRole.description || ""} onChange={(event) => setRoles((prev) => prev.map((role) => (role.id === selectedRole.id ? { ...role, description: event.target.value } : role)))} label="Description" />
                  <Box className="flex justify-end"><Button variant="contained" size="small" disabled={!canManageRoles} onClick={() => void handleDescriptionUpdate()}>Save Description</Button></Box>
                </CardContent>
              </Card>
            )}

            {selectedRole ? <RoleMatrix role={selectedRole} permissions={permissions} disabled={!canManageRoles} onToggle={(permission) => void handleTogglePermission(permission)} /> : null}
          </Box>
        </Box>
      )}

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField label="Role name" size="small" value={newRole.name} onChange={(event) => setNewRole((prev) => ({ ...prev, name: event.target.value }))} />
          <TextField label="Description" size="small" value={newRole.description} onChange={(event) => setNewRole((prev) => ({ ...prev, description: event.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => void handleCreateRole()} variant="contained" disabled={!canManageRoles}>Create</Button>
        </DialogActions>
      </Dialog>
    </AdminRolesLayout>
  );
}
