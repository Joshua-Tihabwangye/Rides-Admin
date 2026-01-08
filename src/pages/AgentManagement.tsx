// @ts-nocheck
import React, { useState, useMemo } from "react";
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import StatusBadge from "../components/StatusBadge";

// D1 – Agent Management (Light/Dark, EVzone themed)
// Route suggestion: /admin/agents
// People-centric table and filters for EVzone agents.

const SAMPLE_AGENTS = [
  {
    id: 1,
    uniqueId: "AGT-001",
    name: "Alice Support",
    email: "alice.support@evzone.com",
    team: "Support",
    roles: "Support Agent",
    status: "Active",
    lastLogin: "2025-11-20 09:24",
  },
  {
    id: 2,
    uniqueId: "AGT-002",
    name: "Brian Onboard",
    email: "brian.onboard@evzone.com",
    team: "Onboarding",
    roles: "Onboarding Agent",
    status: "Active",
    lastLogin: "2025-11-25 08:02",
  },
  {
    id: 3,
    uniqueId: "AGT-003",
    name: "Carol Dispatch",
    email: "carol.dispatch@evzone.com",
    team: "Dispatch",
    roles: "Dispatch Agent",
    status: "Away",
    lastLogin: "2025-11-24 22:41",
  },
  {
    id: 4,
    uniqueId: "AGT-004",
    name: "David Safety",
    email: "david.safety@evzone.com",
    team: "Safety",
    roles: "Safety Agent",
    status: "Suspended",
    lastLogin: "2025-11-22 16:10",
  },
];

export default function AgentManagementPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTeam, setActiveTeam] = useState("All");

  const handleSearchSubmit = (event) => {
    event.preventDefault();
  };

  const handleRowClick = (agent) => {
    navigate(`/admin/agents/${agent.id}`);
  };

  const handleAddAgent = () => {
    // Navigate to add agent page or open modal
    navigate('/admin/agents/new');
  };

  const filteredAgents = SAMPLE_AGENTS.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.email.toLowerCase().includes(search.toLowerCase()) ||
      agent.uniqueId.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = activeTeam === "All" || agent.team === activeTeam;
    return matchesSearch && matchesTeam;
  });

  // Calculate team counts for tabs with totals
  const teamCounts = useMemo(() => {
    return {
      All: SAMPLE_AGENTS.length,
      Support: SAMPLE_AGENTS.filter(a => a.team === "Support").length,
      Onboarding: SAMPLE_AGENTS.filter(a => a.team === "Onboarding").length,
      Dispatch: SAMPLE_AGENTS.filter(a => a.team === "Dispatch").length,
      Safety: SAMPLE_AGENTS.filter(a => a.team === "Safety").length,
    };
  }, []);

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
            Agent Management
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Manage support, onboarding, dispatch and safety agents. Monitor performance and role assignments.
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
          mb: 3
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
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Team:
            </Typography>
            {["All", "Support", "Onboarding", "Dispatch", "Safety"].map(
              (team) => (
                <Chip
                  key={team}
                  size="small"
                  label={`${team} (${teamCounts[team]})`}
                  onClick={() => setActiveTeam(team)}
                  color={activeTeam === team ? "primary" : "default"}
                  variant={activeTeam === team ? "filled" : "outlined"}
                  sx={{ fontSize: 11, height: 24, cursor: 'pointer' }}
                />
              )
            )}
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
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>
                      {agent.uniqueId}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {agent.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 10 }}>
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
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
