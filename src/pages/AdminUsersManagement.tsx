// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
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
  Drawer,
  InputAdornment
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import StatusBadge from "../components/StatusBadge";

// D2 – Admin Users Management (Light/Dark, EVzone themed)
// Route suggestion: /admin/admin-users
// Shows platform admin accounts and uses a RoleMatrix component inside an
// Admin detail drawer. The same RoleMatrix pattern is also used in D3.

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

// Simple RoleMatrix component reused here and in D3 (conceptually shared).
// For demo, roles and resources are static; in production this would be
// driven by RBAC configuration from the backend.

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

function RoleMatrix({ roleName }) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid rgba(148,163,184,0.3)",
        bgcolor: "background.paper",
      }}
    >
      <CardContent className="p-3 flex flex-col gap-2">
        <Typography
          variant="subtitle2"
          className="font-semibold mb-1"
          color="text.primary"
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
                    <TableCell key={perm} align="center">
                      {/* Simple static example: Super Admin gets all, others may not. */}
                      <Chip
                        size="small"
                        label={roleName === "Super Admin" ? "✓" : "-"}
                        sx={{ fontSize: 10, height: 20 }}
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

const SAMPLE_ADMINS = [
  {
    id: 1,
    name: "Alex Admin",
    email: "alex.admin@evzonehq.com",
    roles: "Super Admin",
    regions: "Global",
    status: "Active",
    lastLogin: "2025-11-25 09:02",
    twoFA: "Enabled",
  },
  {
    id: 2,
    name: "Maria Mobility",
    email: "maria.mobility@evzonehq.com",
    roles: "Mobility Admin",
    regions: "East & West Africa",
    status: "Active",
    lastLogin: "2025-11-24 17:30",
    twoFA: "Enabled",
  },
  {
    id: 3,
    name: "Felix Finance",
    email: "felix.finance@evzonehq.com",
    roles: "Finance Admin",
    regions: "East Africa",
    status: "Suspended",
    lastLogin: "2025-11-10 12:15",
    twoFA: "Disabled",
  },
];

function AdminDetailDrawer({ open, onClose, admin }) {
  if (!admin) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 420, md: 480 },
          bgcolor: "background.paper",
        },
      }}
    >
      <Box className="h-full flex flex-col">
        <Box className="px-4 py-3 border-b border-divider flex items-center justify-between">
          <Box>
            <Typography variant="subtitle2" className="font-semibold">
              {admin.name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {admin.roles} · {admin.regions}
            </Typography>
          </Box>
          <Button
            variant="text"
            size="small"
            sx={{ textTransform: "none", color: "text.secondary", fontSize: 11 }}
            onClick={onClose}
          >
            Close
          </Button>
        </Box>

        <Box className="px-4 py-3 flex flex-col gap-3 flex-1 overflow-y-auto">
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid rgba(148,163,184,0.3)",
              bgcolor: "background.default",
            }}
          >
            <CardContent className="p-3 flex flex-col gap-1">
              <Typography variant="caption" color="text.secondary">
                Contact & security
              </Typography>
              <Typography variant="body2" className="text-[12px]">
                Email: {admin.email}
              </Typography>
              <Typography variant="body2" className="text-[12px]">
                Last login: {admin.lastLogin}
              </Typography>
              <Typography variant="body2" className="text-[12px]">
                2FA: {admin.twoFA}
              </Typography>
            </CardContent>
          </Card>

          <RoleMatrix roleName={admin.roles} />
        </Box>

        <Box className="px-4 py-3 border-t border-divider flex flex-col gap-2">
          <Button
            variant="contained"
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: 999,
              fontSize: 12,
              bgcolor: EV_COLORS.primary,
              "&:hover": { bgcolor: "#0fb589" },
            }}
            onClick={() => {
              console.log("Edit roles for admin:", admin.name);
            }}
          >
            Edit roles & regions
          </Button>
          <Button
            variant="outlined"
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: 999,
              fontSize: 12,
              borderColor: "#f97316",
              color: "#f97316",
            }}
            onClick={() => {
              console.log("Suspend admin (pending workflow):", admin.name);
            }}
          >
            Suspend admin
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}

export default function AdminUsersManagementPage() {
  const [search, setSearch] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeRole, setActiveRole] = useState("All");

  const handleSearchSubmit = (event) => {
    event.preventDefault();
  };

  const handleRowClick = (admin) => {
    setSelectedAdmin(admin);
    setDrawerOpen(true);
  };

  const filteredAdmins = SAMPLE_ADMINS.filter((admin) => {
    const matchesSearch = admin.name.toLowerCase().includes(search.toLowerCase()) ||
      admin.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = activeRole === "All" || admin.roles.includes(activeRole);
    return matchesSearch && matchesRole;
  });

  return (
    <Box>
      {/* Title */}
      <Box className="pb-4 flex items-center justify-between gap-2 flex-wrap">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Admin Users Management
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Super Admins and platform admins with access to one or more EVzone modules.
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Card
        elevation={2}
        sx={{
          borderRadius: 2,
          border: "1px solid rgba(148,163,184,0.3)",
          bgcolor: "background.paper",
          mb: 3
        }}
      >
        <CardContent className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <Box component="form" onSubmit={handleSearchSubmit} className="flex-1">
            <TextField
              fullWidth
              size="small"
              placeholder="Search admin users by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": { bgcolor: "background.default", borderRadius: 8 },
                "& .MuiInputBase-input::placeholder": { fontSize: 13 },
              }}
            />
          </Box>
          <Box className="flex flex-wrap gap-1 text-[11px] items-center">
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Role:
            </Typography>
            {["All", "Super Admin", "Mobility Admin", "Finance Admin"].map((role) => (
              <Chip
                key={role}
                size="small"
                label={role}
                onClick={() => setActiveRole(role)}
                color={activeRole === role ? "primary" : "default"}
                variant={activeRole === role ? "filled" : "outlined"}
                sx={{ fontSize: 11, height: 24, cursor: 'pointer' }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card
        elevation={2}
        sx={{
          borderRadius: 2,
          border: "1px solid rgba(148,163,184,0.3)",
          bgcolor: "background.paper"
        }}
      >
        <CardContent className="p-0">
          <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Regions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>2FA</TableCell>
                  <TableCell>Last login</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAdmins.map((admin) => (
                  <TableRow
                    key={admin.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => handleRowClick(admin)}
                  >
                    <TableCell fontWeight={600}>{admin.name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Chip label={admin.roles} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                    </TableCell>
                    <TableCell>{admin.regions}</TableCell>
                    <TableCell>
                      <StatusBadge status={admin.status.toLowerCase()} />
                    </TableCell>
                    <TableCell>{admin.twoFA}</TableCell>
                    <TableCell>{admin.lastLogin}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <AdminDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        admin={selectedAdmin}
      />
    </Box>
  );
}
