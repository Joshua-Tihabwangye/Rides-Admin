import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Avatar,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Alert
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import StatusBadge from "../components/StatusBadge";

// Mock Data
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
        avatarColor: "#03cd8c"
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
        avatarColor: "#f77f00"
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
        avatarColor: "#3b82f6"
    },
];

const ROLES = ["Super Admin", "Mobility Admin", "Finance Admin", "Support Agent"];

// Matrix Data
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

// Helper to check if role has permission
// Mock logic: Super Admin has all. Others have subset.
const hasPermission = (role: string, resource: string, perm: string) => {
    if (role === "Super Admin") return true;
    if (role === "Mobility Admin") {
        if (["Riders", "Drivers"].includes(resource)) return true;
        if (resource === "Companies" && perm !== "Configure") return true;
        return false;
    }
    if (role === "Finance Admin") {
        if (resource === "Payouts") return true;
        if (resource === "Companies" && perm === "View") return true;
        return false;
    }
    return false; // Default
};

function RoleMatrix({ roleName }: { roleName: string }) {
    return (
        <Card
            elevation={2}
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
                    Role Matrix – {roleName}
                </Typography>
                <Box sx={{ overflowX: "auto" }}>
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
                                            <Chip
                                                size="small"
                                                label={hasPermission(roleName, res, perm) ? "✓" : "-"}
                                                color={hasPermission(roleName, res, perm) ? "success" : "default"}
                                                variant={hasPermission(roleName, res, perm) ? "filled" : "outlined"}
                                                sx={{ fontSize: 10, height: 20, minWidth: 24 }}
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

export default function AdminUserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState<string>("");

    const numericId = id ? parseInt(id, 10) : 1;
    const admin = useMemo(() => SAMPLE_ADMINS.find(a => a.id === numericId) || SAMPLE_ADMINS[0], [numericId]);

    // Initialize selectedRole from admin
    React.useEffect(() => {
        if (admin) setSelectedRole(admin.roles);
    }, [admin]);

    const [showSuccess, setShowSuccess] = useState(false);

    const handleRoleChange = (event: any) => {
        const newRole = event.target.value;
        // In a real app we'd likely have validation here
        setSelectedRole(newRole);
    };

    const handleSave = () => {
        // Simulate an API call
        setTimeout(() => {
            setShowSuccess(true);
        }, 300);
    };

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/admin-users')}
                    sx={{ color: 'text.secondary', textTransform: 'none' }}
                >
                    Back to Admin Users
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Left Col: Profile */}
                <Grid item xs={12} md={4}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                            <Avatar
                                sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: admin.avatarColor || 'primary.main', fontSize: 32 }}
                            >
                                {admin.name.charAt(0)}
                            </Avatar>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                {admin.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {admin.email}
                            </Typography>
                            <StatusBadge status={admin.status.toLowerCase()} sx={{ mb: 3 }} />

                            <Box sx={{ textAlign: 'left', mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant="subtitle2">Security</Typography>
                                <Typography variant="caption" display="block">2FA: {admin.twoFA}</Typography>
                                <Typography variant="caption" display="block">Last Login: {admin.lastLogin}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Col: Role Management */}
                <Grid item xs={12} md={8}>
                    {showSuccess && (
                        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setShowSuccess(false)}>
                            Role updated successfully!
                        </Alert>
                    )}
                    <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>Role Assignment</Typography>

                            <Box sx={{ mb: 3 }}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Assigning "Super Admin" grants full access to all system resources. Please proceed with caution.
                                </Alert>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Select Role</InputLabel>
                                    <Select
                                        value={selectedRole}
                                        label="Select Role"
                                        onChange={handleRoleChange}
                                    >
                                        {ROLES.map(r => (
                                            <MenuItem key={r} value={r}>{r}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#03cd8c' }}>
                                    Save Changes
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Role Matrix Preview */}
                    <RoleMatrix roleName={selectedRole} />
                </Grid>
            </Grid>
        </Box>
    );
}
