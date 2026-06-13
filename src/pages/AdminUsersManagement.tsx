import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import StatusBadge from "../components/StatusBadge";
import { listAdminUsers, type AdminUserResponse } from "../services/api/adminApi";

export default function AdminUsersManagementPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState("All");
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listAdminUsers());
    } catch (err: any) {
      setError(err?.message ?? "Failed to load admin users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = activeRole === "All" || user.roles.some((role) => role.toLowerCase().includes(activeRole.toLowerCase()));
      return matchesSearch && matchesRole;
    });
  }, [activeRole, search, users]);

  const handleExport = () => {
    const rows = [
      ["Name", "Email", "Roles", "Regions", "Status", "2FA", "Last login"],
      ...filteredUsers.map((user) => [
        user.name,
        user.email,
        user.roles.join("; "),
        user.regions,
        user.status,
        user.twoFA ? "Enabled" : "Disabled",
        new Date(user.lastLogin).toISOString(),
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admin-users.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2 flex-wrap">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Admin Users Management
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Privileged accounts, roles, regions, and security posture.
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ textTransform: "none", borderRadius: 2, bgcolor: "#03cd8c", "&:hover": { bgcolor: "#0fb589" } }}
            disabled
          >
            Add admin
          </Button>
        </Box>
      </Box>

      <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)", mb: 3 }}>
        <CardContent className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <Box className="flex-1">
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
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.default", borderRadius: 2 } }}
            />
          </Box>
          <Box className="flex flex-wrap gap-1 items-center">
            <Typography variant="caption" color="text.secondary">
              Role:
            </Typography>
            {["All", "Super Admin", "Admin"].map((role) => (
              <Chip
                key={role}
                size="small"
                label={role}
                onClick={() => setActiveRole(role)}
                color={activeRole === role ? "primary" : "default"}
                variant={activeRole === role ? "filled" : "outlined"}
                sx={{ fontSize: 11, height: 24, cursor: "pointer" }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      <Card elevation={2} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)" }}>
        <CardContent className="p-0">
          <TableContainer component={Paper} elevation={0} sx={{ bgcolor: "transparent" }}>
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
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/admin/admin-users/${user.id}`)}>
                    <TableCell sx={{ fontWeight: 600 }}>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Box className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Chip key={role} label={role} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>{user.regions}</TableCell>
                    <TableCell>
                      <StatusBadge status={user.status.toLowerCase()} />
                    </TableCell>
                    <TableCell>{user.twoFA ? "Enabled" : "Disabled"}</TableCell>
                    <TableCell>{new Date(user.lastLogin).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No admin users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
