// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
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
import PageStateCard from "../components/PageStateCard";
import { getAuthRoles } from "../auth/auth";
import { hasPermissionByRoles } from "../auth/permissions";
import { createAdminRole, listAdminRoles, patchAdminRole } from "../services/api/adminApi";

const PERMISSIONS = ["View", "Edit", "Suspend/Block", "Configure"];
const RESOURCES = ["Riders", "Drivers", "Companies", "Agents", "Payouts", "Roles & RBAC", "System flags"];

function AdminRolesLayout({ children }) {
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

function parsePermissionMatrix(permissions = []) {
  const matrix = {};
  RESOURCES.forEach((resource) => {
    matrix[resource] = {};
    PERMISSIONS.forEach((perm) => {
      matrix[resource][perm] = permissions.includes(`${resource}:${perm}`);
    });
  });
  return matrix;
}

function flattenPermissionMatrix(matrix) {
  const output = [];
  RESOURCES.forEach((resource) => {
    PERMISSIONS.forEach((perm) => {
      if (matrix?.[resource]?.[perm]) output.push(`${resource}:${perm}`);
    });
  });
  return output;
}

function RoleMatrix({ role, onToggle, disabled }) {
  const matrix = useMemo(() => parsePermissionMatrix(role?.permissions || []), [role]);

  return (
    <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.6)" }}>
      <CardContent className="p-3 flex flex-col gap-2">
        <Typography variant="subtitle2" className="font-semibold mb-1">Role matrix – {role?.name || "-"}</Typography>
        <Box className="overflow-x-auto">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Resource</TableCell>
                {PERMISSIONS.map((perm) => <TableCell key={perm} align="center">{perm}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {RESOURCES.map((resource) => (
                <TableRow key={resource}>
                  <TableCell>{resource}</TableCell>
                  {PERMISSIONS.map((perm) => (
                    <TableCell key={perm} align="center">
                      <Button size="small" disabled={disabled} variant={matrix[resource][perm] ? "contained" : "outlined"} onClick={() => onToggle(resource, perm)}>
                        {matrix[resource][perm] ? "✓" : "-"}
                      </Button>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const canManageRoles = hasPermissionByRoles(getAuthRoles(), "manage_roles");
  const selectedRole = useMemo(() => roles.find((role) => role.id === selectedRoleId) || roles[0], [roles, selectedRoleId]);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const rows = await listAdminRoles();
      setRoles(rows);
      setSelectedRoleId((prev) => prev || rows[0]?.id || "");
      setStatus(null);
    } catch (error) {
      console.error("Failed to load admin roles", error);
      setStatus({ type: "error", message: "Failed to load roles from backend." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoles();
  }, []);

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

  const handleTogglePermission = async (resource, perm) => {
    if (!selectedRole || !canManageRoles) {
      setStatus({ type: "warning", message: "Your account cannot update role permissions." });
      return;
    }
    const matrix = parsePermissionMatrix(selectedRole.permissions || []);
    matrix[resource][perm] = !matrix[resource][perm];
    try {
      await patchAdminRole(selectedRole.id, { permissions: flattenPermissionMatrix(matrix) });
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

            {selectedRole ? <RoleMatrix role={selectedRole} disabled={!canManageRoles} onToggle={(resource, perm) => void handleTogglePermission(resource, perm)} /> : null}
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
