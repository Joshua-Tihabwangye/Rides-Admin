// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  InputAdornment,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import StatusBadge from "../components/StatusBadge";
import { listAdminUsers } from "../services/api/adminApi";

// Backend-authoritative agent list derived from admin/platform users.
// Team is inferred from the first role claim; roles are displayed as-is.

export default function AgentManagementPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTeam, setActiveTeam] = useState("All");
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await listAdminUsers();
      const mapped = users.map((user) => {
        const primaryRole = user.roles[0] || "Admin";
        return {
          id: user.id,
          uniqueId: user.id,
          name: user.name,
          email: user.email,
          team: primaryRole,
          roles: user.roles.join(", "),
          status: user.status,
          lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—",
        };
      });
      setAgents(mapped);
    } catch (err) {
      setError(err?.message || "Failed to load agents from backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAgents();
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
  };

  const handleRowClick = (agent) => {
    navigate(`/admin/agents/${agent.id}`);
  };

  const handleAddAgent = () => {
    navigate("/admin/agents/new");
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.email.toLowerCase().includes(search.toLowerCase()) ||
      agent.uniqueId.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = activeTeam === "All" || agent.team === activeTeam;
    return matchesSearch && matchesTeam;
  });

  const teams = useMemo(() => {
    const all = Array.from(new Set(agents.map((a) => a.team))).sort();
    return ["All", ...all];
  }, [agents]);

  const teamCounts = useMemo(() => {
    const counts = { All: agents.length };
    teams.slice(1).forEach((team) => {
      counts[team] = agents.filter((a) => a.team === team).length;
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
        {/* Add Agent Button */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAgent}
          sx={{ textTransform: "none", borderRadius: 999 }}
        >
          Add agent
        </Button>
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
                    <TableCell>{agent.lastLogin}</TableCell>
                  </TableRow>
                ))}
                {filteredAgents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: "text.secondary" }}>
                      No agents found.
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
