// @ts-nocheck
import React, { useState } from "react";
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
  InputAdornment
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import StatusBadge from "../components/StatusBadge";

// D1 – Agent Management (Light/Dark, EVzone themed)
// Route suggestion: /admin/agents
// People-centric table and filters for EVzone agents.

const SAMPLE_AGENTS = [
  {
    id: 1,
    name: "Alice Support",
    email: "alice.support@evzone.com",
    team: "Support",
    roles: "Support Agent",
    status: "Active",
    lastLogin: "2025-11-20 09:24",
  },
  {
    id: 2,
    name: "Brian Onboard",
    email: "brian.onboard@evzone.com",
    team: "Onboarding",
    roles: "Onboarding Agent",
    status: "Active",
    lastLogin: "2025-11-25 08:02",
  },
  {
    id: 3,
    name: "Carol Dispatch",
    email: "carol.dispatch@evzone.com",
    team: "Dispatch",
    roles: "Dispatch Agent",
    status: "Away",
    lastLogin: "2025-11-24 22:41",
  },
  {
    id: 4,
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

  const filteredAgents = SAMPLE_AGENTS.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.email.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = activeTeam === "All" || agent.team === activeTeam;
    return matchesSearch && matchesTeam;
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
            Agent Management
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Manage support, onboarding, dispatch and safety agents. Monitor performance and role assignments.
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
              placeholder="Search agents by name or email…"
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
                  label={team}
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
                    <TableCell fontWeight={600}>{agent.name}</TableCell>
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

