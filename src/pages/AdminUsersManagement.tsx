import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

// RoleMatrix and AdminDetailDrawer moved to AdminUserDetail page.
// This page now only lists users.


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

export default function AdminUsersManagementPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState("All");

  const handleSearchSubmit = (event) => {
    event.preventDefault();
  };

  const handleRowClick = (admin) => {
    navigate(`/admin/admin-users/${admin.id}`);
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
                    <TableCell sx={{ fontWeight: 600 }}>{admin.name}</TableCell>
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
    </Box>
  );
}
