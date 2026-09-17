import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import StatusBadge from "../components/StatusBadge";
import {
  createAdminAgent,
  listAdminAgents,
  type AdminAgentResponse,
} from "../services/api/adminApi";

// Backend-authoritative agent list derived from admin/platform users.
// Team is inferred from the first role claim; roles are displayed as-is.

type AgentRow = {
  id: string;
  uniqueId: string;
  name: string;
  email: string;
  team: string;
  roles: string;
  status: AdminAgentResponse["status"];
  lastLogin: string;
  tickets: number;
  openTickets: number;
  qaScore: string;
};

function mapAgent(user: AdminAgentResponse): AgentRow {
  const primaryRole = user.team || user.profile?.department || user.roles[0] || "Agent";
  return {
    id: user.id,
    uniqueId: user.profile?.employeeCode || user.id,
    name: user.name,
    email: user.email,
    team: primaryRole,
    roles: user.roles.join(", ") || "Admin",
    status: user.status,
    lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—",
    tickets: user.metrics.assignedTickets,
    openTickets: user.metrics.openTickets,
    qaScore: user.metrics.qaScore == null ? "—" : user.metrics.qaScore.toFixed(1),
  };
}

const initialCreateForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  department: "Support",
  title: "",
  portalRole: "support_t1",
};

export default function AgentManagementPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTeam, setActiveTeam] = useState("All");
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await listAdminAgents();
      setAgents(users.map(mapAgent));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agents from backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAgents();
  }, []);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const handleRowClick = (agent: AgentRow) => {
    navigate(`/admin/agents/${agent.id}`);
  };

  const handleCreateAgent = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const created = await createAdminAgent({
        fullName: createForm.fullName,
        email: createForm.email,
        phone: createForm.phone || undefined,
        password: createForm.password || undefined,
        roles: ["agent"],
        department: createForm.department,
        title: createForm.title || undefined,
        portalRole: createForm.portalRole,
      });
      setAgents((current) => [mapAgent(created), ...current]);
      setCreateForm(initialCreateForm);
      setCreateOpen(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setCreating(false);
    }
  };

  const kpis = useMemo(() => {
    const total = agents.length;
    const online = agents.filter(
      (a) => a.status === "Active" && a.lastLogin !== "—",
    ).length;
    const openTickets = agents.reduce((sum, a) => sum + a.openTickets, 0);
    const scores = agents
      .map((a) => parseFloat(a.qaScore))
      .filter((n) => !Number.isNaN(n));
    const avgQa = scores.length
      ? (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1)
      : "—";
    return { total, online, openTickets, avgQa };
  }, [agents]);

  const filteredAgents = agents.filter((agent) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      agent.name.toLowerCase().includes(query) ||
      agent.email.toLowerCase().includes(query) ||
      agent.uniqueId.toLowerCase().includes(query) ||
      agent.team.toLowerCase().includes(query) ||
      agent.roles.toLowerCase().includes(query);
    const matchesTeam = activeTeam === "All" || agent.team === activeTeam;
    return matchesSearch && matchesTeam;
  });

  const teams = useMemo(() => {
    const all = Array.from(new Set(agents.map((agent) => agent.team))).sort();
    return ["All", ...all];
  }, [agents]);

  const teamCounts = useMemo(() => {
    const counts: Record<string, number> = { All: agents.length };
    teams.slice(1).forEach((team) => {
      counts[team] = agents.filter((agent) => agent.team === team).length;
    });
    return counts;
  }, [agents, teams]);

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
      {/* Title */}
      <Box className="pb-4 flex items-center justify-between gap-2 flex-wrap">
        <Box>
          <Typography variant="h6" className="font-semibold tracking-tight" color="text.primary">
            Agent Management
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Manage support, onboarding, dispatch and safety agents. Data is fetched from the backend.
          </Typography>
        </Box>
        <Tooltip title="Create a backend agent account and portal profile.">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ textTransform: "none", borderRadius: 999 }}
            onClick={() => setCreateOpen(true)}
          >
            Add agent
          </Button>
        </Tooltip>
      </Box>

      {/* KPI Summary */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        {[
          { label: "Total agents", value: kpis.total },
          { label: "Active / recent", value: kpis.online },
          { label: "Open tickets", value: kpis.openTickets },
          { label: "Avg QA score", value: kpis.avgQa },
        ].map((kpi) => (
          <Card
            key={kpi.label}
            elevation={1}
            sx={{ flex: "1 1 140px", borderRadius: 2, border: "1px solid rgba(148,163,184,0.3)" }}
          >
            <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">
                {kpi.label}
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {kpi.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Filters */}
      <Card
        elevation={2}
        sx={{
          borderRadius: 2,
          border: "1px solid rgba(148,163,184,0.3)",
          bgcolor: "background.paper",
          mb: 3,
        }}
      >
        <CardContent className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <Box component="form" onSubmit={handleSearchSubmit} className="flex-1">
            <TextField
              fullWidth
              size="small"
              placeholder="Search agents by name, email, or ID…"
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
            <Typography variant="caption" color="text.secondary">
              Team:
            </Typography>
            {teams.map((team) => (
              <Chip
                key={team}
                size="small"
                label={`${team} (${teamCounts[team] ?? 0})`}
                onClick={() => setActiveTeam(team)}
                color={activeTeam === team ? "primary" : "default"}
                variant={activeTeam === team ? "filled" : "outlined"}
                sx={{ fontSize: 11, height: 24, cursor: "pointer" }}
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
          bgcolor: "background.paper",
        }}
      >
        <CardContent className="p-0">
          <TableContainer component={Paper} elevation={0} sx={{ bgcolor: "transparent" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Tickets</TableCell>
                  <TableCell>QA</TableCell>
                  <TableCell>Last login</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow
                    key={agent.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => handleRowClick(agent)}
                  >
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 11, color: "text.secondary" }}>
                      {agent.uniqueId}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {agent.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: 10 }}>
                          {agent.uniqueId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{agent.email}</TableCell>
                    <TableCell>
                      <Chip label={agent.team} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                    </TableCell>
                    <TableCell>{agent.roles}</TableCell>
                    <TableCell>
                      <StatusBadge status={agent.status.toLowerCase()} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {agent.openTickets} open
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {agent.tickets} assigned
                      </Typography>
                    </TableCell>
                    <TableCell>{agent.qaScore}</TableCell>
                    <TableCell>{agent.lastLogin}</TableCell>
                  </TableRow>
                ))}
                {filteredAgents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3, color: "text.secondary" }}>
                      No agents found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create agent</DialogTitle>
        <DialogContent sx={{ pt: 1, display: "grid", gap: 2 }}>
          {createError ? <Alert severity="error">{createError}</Alert> : null}
          <TextField
            label="Full name"
            size="small"
            value={createForm.fullName}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Email"
            size="small"
            type="email"
            value={createForm.email}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
            fullWidth
          />
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <TextField
              label="Phone"
              size="small"
              value={createForm.phone}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Temporary password"
              size="small"
              type="password"
              value={createForm.password}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
              fullWidth
            />
          </Box>
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <TextField
              label="Department"
              size="small"
              select
              value={createForm.department}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, department: event.target.value }))}
              fullWidth
            >
              {["Support", "Onboarding", "Dispatch", "Safety", "Finance"].map((department) => (
                <MenuItem key={department} value={department}>
                  {department}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Portal role"
              size="small"
              select
              value={createForm.portalRole}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, portalRole: event.target.value }))}
              fullWidth
            >
              {["support_t1", "support_t2", "dispatcher", "supervisor", "qa"].map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <TextField
            label="Title"
            size="small"
            value={createForm.title}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" disabled={creating} onClick={handleCreateAgent} sx={{ textTransform: "none" }}>
            {creating ? "Creating..." : "Create agent"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
