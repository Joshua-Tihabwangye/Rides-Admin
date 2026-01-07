// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

// D3 – Roles & Permissions (Light/Dark, EVzone themed, with editable RoleMatrix)
// Route suggestion: /admin/roles
// Shows list of roles and a RoleMatrix editor. "New role" opens a popup
// dialog. Non–Super Admin roles have editable matrices and description.
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle "Roles & Permissions".
//    - Left card lists roles (Super Admin, Mobility Admin, Finance Admin,
//      Read-only Analyst) with scope and #admins.
//    - Right side shows selected role card and a RoleMatrix below it.
// 2) Select role
//    - Click a role row or use the select dropdown; the right-side card and
//      matrix should update to that role.
// 3) Edit matrix
//    - For non–Super Admin roles (e.g. Mobility Admin), clicking a cell in the
//      matrix toggles it between ✓ and - and logs the change. For Super Admin,
//      the matrix is view-only (no changes).
// 4) Create new role
//    - Click "+ New role"; a dialog should open with Role name, Scope and
//      Description fields.
//    - Fill in values and click "Create role"; the new role should appear in
//      the roles list and become selected. Its matrix should be editable.
// 5) Edit description
//    - For non–Super Admin roles, the description field in the right-side
//      card is editable. Changes should update local state and not crash the
//      matrix.
// 6) Theme toggle
//    - Switch between Light and Dark modes using the header toggle. Layout and
//      state must remain stable.

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminRolesLayout({ children }) {
  return (
    <Box>
      {/* Title */}
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Roles & Permissions
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Define what each admin role can see and do across EVzone modules.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">
        {children}
      </Box>
    </Box>
  );
}

const RESOURCES = [
  "Riders",
  "Drivers",
  "Companies",
  "Agents",
  "Payouts",
  "Roles & RBAC",
  "System flags",
];

const PERMISSIONS = ["View", "Edit", "Suspend/Block", "Configure"];

function buildDefaultMatrix(roleName) {
  const base = {};
  RESOURCES.forEach((res) => {
    base[res] = {};
    PERMISSIONS.forEach((perm) => {
      // Simple rule: Super Admin gets all, others view-only.
      base[res][perm] = roleName === "Super Admin" ? true : perm === "View";
    });
  });
  return base;
}

function RoleMatrix({ roleName, editable = false }) {
  const [matrix, setMatrix] = useState(() => buildDefaultMatrix(roleName));

  useEffect(() => {
    // Reset matrix when the role changes so the grid reflects that role.
    setMatrix(buildDefaultMatrix(roleName));
  }, [roleName]);

  const toggleCell = (res, perm) => {
    if (!editable) return;
    setMatrix((prev) => {
      const next = { ...prev };
      next[res] = { ...prev[res], [perm]: !prev[res][perm] };
      console.log("RoleMatrix change", {
        roleName,
        resource: res,
        perm,
        value: next[res][perm],
      });
      return next;
    });
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 8,
        border: "1px solid rgba(148,163,184,0.6)",
        background: "linear-gradient(145deg, #f9fafb, #ffffff)",
      }}
    >
      <CardContent className="p-3 flex flex-col gap-2">
        <Typography
          variant="subtitle2"
          className="font-semibold text-slate-900 mb-1"
        >
          Role matrix – {roleName}
        </Typography>
        <Box className="overflow-x-auto">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Resource</TableCell>
                {PERMISSIONS.map((perm) => (
                  <TableCell key={perm} align="center">
                    {perm}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {RESOURCES.map((res) => (
                <TableRow key={res}>
                  <TableCell>{res}</TableCell>
                  {PERMISSIONS.map((perm) => (
                    <TableCell
                      key={perm}
                      align="center"
                      onClick={() => toggleCell(res, perm)}
                      sx={{
                        cursor: editable ? "pointer" : "default",
                        transition: 'all 0.15s ease',
                        '&:hover': editable ? {
                          bgcolor: 'action.hover',
                          transform: 'scale(1.05)',
                        } : {},
                      }}
                    >
                      <Chip
                        size="small"
                        label={matrix[res][perm] ? "✓" : "-"}
                        sx={{
                          fontSize: 10,
                          height: 20,
                          bgcolor: matrix[res][perm]
                            ? "#dcfce7"
                            : "#f9fafb",
                          color: matrix[res][perm]
                            ? "#166534"
                            : "#6b7280",
                          transition: 'all 0.15s ease',
                          '&:hover': editable ? {
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          } : {},
                        }}
                      />
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

const INITIAL_ROLES = [
  {
    id: 1,
    name: "Super Admin",
    scope: "Global",
    admins: 3,
    description: "Full access to all modules and RBAC.",
  },
  {
    id: 2,
    name: "Mobility Admin",
    scope: "Rides & Logistics",
    admins: 5,
    description: "Config and operations for Rides & Logistics only.",
  },
  {
    id: 3,
    name: "Finance Admin",
    scope: "Finance & payouts",
    admins: 2,
    description: "Payouts, statements and adjustments.",
  },
  {
    id: 4,
    name: "Read-only Analyst",
    scope: "All modules (read-only)",
    admins: 4,
    description: "Reporting only, no write actions.",
  },
];

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState(INITIAL_ROLES[0].id);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState({
    name: "",
    scope: "",
    description: "",
  });

  const selectedRole =
    roles.find((role) => role.id === selectedRoleId) || roles[0];

  const handleRoleChange = (event) => {
    const id = Number(event.target.value);
    setSelectedRoleId(id);
  };

  const handleNewRoleChange = (field) => (event) => {
    setNewRole((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCreateRole = () => {
    const name = newRole.name.trim();
    if (!name) return;
    const scope = newRole.scope.trim() || "Custom";
    const description =
      newRole.description.trim() || "Custom role created from the Admin UI.";
    const nextId = roles.length
      ? Math.max(...roles.map((r) => r.id)) + 1
      : 1;
    const roleToAdd = {
      id: nextId,
      name,
      scope,
      description,
      admins: 0,
    };
    const updated = [...roles, roleToAdd];
    setRoles(updated);
    setSelectedRoleId(nextId);
    setNewRole({ name: "", scope: "", description: "" });
    setCreateDialogOpen(false);
    console.log("Created new role:", roleToAdd);
  };

  const handleDescriptionChange = (event) => {
    const value = event.target.value;
    setRoles((prev) =>
      prev.map((role) =>
        role.id === selectedRole.id ? { ...role, description: value } : role
      )
    );
  };

  return (
    <AdminRolesLayout>
      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Left – Role list */}
        <Card
          elevation={1}
          sx={{
            flex: 1,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #f9fafb, #ffffff)",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Box className="flex items-center justify-between gap-2">
              <Typography
                variant="subtitle2"
                className="font-semibold text-slate-900"
              >
                Roles
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  fontSize: 11,
                }}
                onClick={() => setCreateDialogOpen(true)}
              >
                + New role
              </Button>
            </Box>
            <Divider className="!my-1" />

            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
                    <TableCell>Role</TableCell>
                    <TableCell>Scope</TableCell>
                    <TableCell align="right">Admins</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow
                      key={role.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      selected={role.id === selectedRoleId}
                      onClick={() => setSelectedRoleId(role.id)}
                    >
                      <TableCell>{role.name}</TableCell>
                      <TableCell>{role.scope}</TableCell>
                      <TableCell align="right">{role.admins}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography
              variant="caption"
              className="text-[11px] text-slate-500 mt-1"
            >
              Assign roles to admin users in the Admin Users screen. RBAC
              changes take effect immediately.
            </Typography>
          </CardContent>
        </Card>

        {/* Right – Role detail & matrix */}
        <Box className="flex flex-col flex-[1.5] gap-3">
          <Card
            elevation={1}
            sx={{
              borderRadius: 8,
              border: "1px solid rgba(148,163,184,0.5)",
              background: "linear-gradient(145deg, #eef2ff, #ffffff)",
            }}
          >
            <CardContent className="p-4 flex flex-col gap-3">
              <Box className="flex items-center justify-between gap-2">
                <Box className="flex-1 min-w-0">
                  <Typography
                    variant="subtitle2"
                    className="font-semibold text-slate-900"
                  >
                    {selectedRole.name}
                  </Typography>

                  {/* Editable description for non–Super Admin roles */}
                  <TextField
                    multiline
                    minRows={2}
                    maxRows={4}
                    size="small"
                    label="Description"
                    value={selectedRole.description}
                    onChange={handleDescriptionChange}
                    disabled={selectedRole.name === "Super Admin"}
                    fullWidth
                    sx={{
                      mt: 1,
                      "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" },
                    }}
                  />
                </Box>

                <Box className="flex flex-col items-end gap-1">
                  <Typography
                    variant="caption"
                    className="text-[11px] text-slate-500"
                  >
                    Select role
                  </Typography>
                  <Select
                    size="small"
                    value={selectedRoleId}
                    onChange={handleRoleChange}
                    sx={{
                      minWidth: 180,
                      "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" },
                    }}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <RoleMatrix
            roleName={selectedRole.name}
            editable={selectedRole.name !== "Super Admin"}
          />
        </Box>
      </Box>

      {/* Create new role dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle className="text-sm font-semibold">
          Create new role
        </DialogTitle>
        <DialogContent className="flex flex-col gap-3 pt-2">
          <TextField
            label="Role name"
            size="small"
            fullWidth
            value={newRole.name}
            onChange={handleNewRoleChange("name")}
          />
          <TextField
            label="Scope (e.g. Rides & Logistics)"
            size="small"
            fullWidth
            value={newRole.scope}
            onChange={handleNewRoleChange("scope")}
          />
          <TextField
            label="Description"
            size="small"
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            value={newRole.description}
            onChange={handleNewRoleChange("description")}
          />
          <Typography
            variant="caption"
            className="text-[11px] text-slate-500"
          >
            After creating the role, adjust its matrix below and assign it to
            Admin users from the Admin Users screen.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateDialogOpen(false)}
            size="small"
            sx={{ textTransform: "none", fontSize: 12 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateRole}
            size="small"
            variant="contained"
            sx={{
              textTransform: "none",
              fontSize: 12,
              borderRadius: 999,
              bgcolor: EV_COLORS.primary,
              "&:hover": { bgcolor: "#0fb589" },
            }}
          >
            Create role
          </Button>
        </DialogActions>
      </Dialog>
    </AdminRolesLayout>
  );
}
