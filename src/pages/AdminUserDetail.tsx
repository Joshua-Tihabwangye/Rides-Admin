import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import StatusBadge from "../components/StatusBadge";
import { ADMIN_ROLE_OPTIONS, getAuthRoles } from "../auth/auth";
import { hasPermissionByRoles } from "../auth/permissions";
import { getAdminUser, patchAdminUser, type AdminUserResponse } from "../services/api/adminApi";

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUserResponse | null>(null);
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canManageAdminUsers = hasPermissionByRoles(getAuthRoles(), "manage_admin_users");

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminUser(id);
        setUser(data);
        setRole(data.roles[0] ?? "admin");
      } catch (err: any) {
        setError(err?.message ?? "Failed to load admin user");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const handleSave = async () => {
    if (!id || !user || !canManageAdminUsers) {
      setError(canManageAdminUsers ? null : "Your account cannot change admin users.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const updated = await patchAdminUser(id, { roles: [role] });
      setUser(updated);
      setMessage("Role updated successfully.");
    } catch (err: any) {
      setError(err?.message ?? "Failed to save admin user");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return <Alert severity="error">{error || "Admin user not found"}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/admin/admin-users")} sx={{ color: "text.secondary", textTransform: "none" }}>
          Back to Admin Users
        </Button>
        <Typography variant="caption" color="text.secondary">
          Privileged account detail
        </Typography>
      </Box>

      {!canManageAdminUsers ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This view is readable, but your account cannot change admin users or role assignments.
        </Alert>
      ) : null}

      {message ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: "center", pt: 4 }}>
              <Avatar sx={{ width: 100, height: 100, mx: "auto", mb: 2, bgcolor: user.avatarColor || "primary.main", fontSize: 32 }}>
                {user.name.charAt(0)}
              </Avatar>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <StatusBadge status={user.status.toLowerCase()} sx={{ mb: 3 }} />

              <Box sx={{ textAlign: "left", mt: 3, display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="subtitle2">Security</Typography>
                <Typography variant="caption" display="block">
                  2FA: {user.twoFA ? "Enabled" : "Disabled"}
                </Typography>
                <Typography variant="caption" display="block">
                  Last Login: {new Date(user.lastLogin).toLocaleString()}
                </Typography>
                <Typography variant="caption" display="block">
                  Regions: {user.regions}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Role Assignment
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Assigning super admin grants access to all privileged routes and actions.
                </Alert>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Role</InputLabel>
                  <Select value={role} label="Select Role" disabled={!canManageAdminUsers} onChange={(event) => setRole(String(event.target.value))}>
                    {ADMIN_ROLE_OPTIONS.map((item) => (
                      <MenuItem key={item.value} value={item.value}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" startIcon={<VerifiedUserIcon />} onClick={handleSave} disabled={saving || !canManageAdminUsers} sx={{ bgcolor: "#03cd8c", textTransform: "none" }}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
