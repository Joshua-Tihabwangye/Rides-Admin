// @ts-nocheck
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  FormControl,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import PeriodSelector, { PeriodOption } from '../components/PeriodSelector';
import QueueIcon from "@mui/icons-material/Queue";
import { getRiders, getDrivers, upsertRider, upsertDriver } from "../lib/peopleStore";

// Base data for different regions
const REGION_DATA = {
  'All Regions': {
    totalIncidents: 18,
    criticalIncidents: 1,
    sosActivations: 2,
    usersUnderReview: 7,
    note: {
      total: "+3 vs previous period",
      critical: "All handled",
      sos: "0 unresolved",
      users: "4 riders · 3 drivers"
    }
  },
  'East Africa': {
    totalIncidents: 10,
    criticalIncidents: 1,
    sosActivations: 1,
    usersUnderReview: 4,
    note: {
      total: "+2 vs previous period",
      critical: "All handled",
      sos: "0 unresolved",
      users: "2 riders · 2 drivers"
    }
  },
  'West Africa': {
    totalIncidents: 8,
    criticalIncidents: 0,
    sosActivations: 1,
    usersUnderReview: 3,
    note: {
      total: "+1 vs previous period",
      critical: "None this period",
      sos: "0 unresolved",
      users: "2 riders · 1 driver"
    }
  },
};

const BASE_INCIDENT_CITIES = [
  { city: "Kampala", region: "East Africa", incidents: 7 },
  { city: "Lagos", region: "West Africa", incidents: 5 },
  { city: "Nairobi", region: "East Africa", incidents: 3 },
  { city: "Accra", region: "West Africa", incidents: 3 },
];

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel?.toLowerCase()) {
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
      return "success";
    default:
      return "default";
  }
};

export default function SafetyOverviewDashboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodOption>('today');
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions');
  const [usersUnderReview, setUsersUnderReview] = useState<any[]>([]);

  // Fetch users under review from peopleStore
  useEffect(() => {
    const riders = getRiders();
    const drivers = getDrivers();
    
    // Get riders and drivers that are under review (not approved)
    const underReviewRiders = riders
      .filter(r => r.primaryStatus === 'under_review')
      .map(r => ({
        id: r.id,
        name: r.name,
        type: 'Rider',
        city: r.city,
        reason: r.risk === 'High' ? 'Multiple low ratings' : r.risk === 'Medium' ? 'Needs monitoring' : 'Pending verification',
        riskLevel: r.risk || 'Low',
        record: r,
      }));
    
    const underReviewDrivers = drivers
      .filter(d => d.primaryStatus === 'under_review')
      .map(d => ({
        id: d.id,
        name: d.name,
        type: 'Driver',
        city: d.city,
        reason: d.risk === 'High' ? 'High cancellation rate' : d.risk === 'Medium' ? 'Needs monitoring' : 'Document verification',
        riskLevel: d.risk || 'Low',
        record: d,
      }));
    
    setUsersUnderReview([...underReviewRiders, ...underReviewDrivers]);
  }, []);

  const handlePeriodChange = (newPeriod: PeriodOption) => {
    setPeriod(newPeriod);
  };

  const periodMultiplier: Record<PeriodOption, number> = {
    today: 0.25,
    '7days': 0.6,
    '30days': 1,
    thisMonth: 1.1,
    custom: 0.8,
  };

  // Get region-specific KPIs
  const INCIDENT_KPIS = useMemo(() => {
    const m = periodMultiplier[period] ?? 1;
    const regionData = REGION_DATA[selectedRegion] || REGION_DATA['All Regions'];
    
    return [
      { 
        label: "Total incidents", 
        value: Math.max(1, Math.round(regionData.totalIncidents * m)), 
        note: regionData.note.total 
      },
      { 
        label: "Critical incidents", 
        value: Math.max(0, Math.round(regionData.criticalIncidents * m)), 
        note: regionData.note.critical 
      },
      { 
        label: "SOS activations", 
        value: Math.max(0, Math.round(regionData.sosActivations * m)), 
        note: regionData.note.sos 
      },
      { 
        label: "Users under review", 
        value: usersUnderReview.length, 
        note: `${usersUnderReview.filter(u => u.type === 'Rider').length} riders · ${usersUnderReview.filter(u => u.type === 'Driver').length} drivers` 
      },
    ];
  }, [period, selectedRegion, usersUnderReview]);

  const handleUserClick = (user) => {
    // Navigate to rider or driver management based on type
    if (user.type === 'Driver') {
      navigate(`/admin/drivers/${user.id}`);
    } else {
      navigate(`/admin/riders/${user.id}`);
    }
  };

  const handleApproveUser = (user, e) => {
    e.stopPropagation();
    
    if (user.type === 'Rider') {
      const updatedRecord = { ...user.record, primaryStatus: 'approved' };
      upsertRider(updatedRecord);
    } else {
      const updatedRecord = { ...user.record, primaryStatus: 'approved' };
      upsertDriver(updatedRecord);
    }
    
    // Remove from local state
    setUsersUnderReview(prev => prev.filter(u => !(u.id === user.id && u.type === user.type)));
  };

  const handleViewQueue = () => {
    navigate('/admin/risk?view=queue');
  };

  const handleSeeMoreIncidents = () => {
    navigate("/admin/risk");
  };

  const handleCityClick = (city: string) => {
    navigate(`/admin/risk?city=${city}`);
  }

  // Incident distribution data - varies by region
  const incidentData = useMemo(() => {
    const m = periodMultiplier[period] ?? 1;
    const regionMultiplier = selectedRegion === 'East Africa' ? 1.2 : selectedRegion === 'West Africa' ? 0.8 : 1;
    
    return [
      { type: "Accident", count: Math.max(0, Math.round(8 * m * regionMultiplier)), color: "#ef4444" },
      { type: "Harassment", count: Math.max(0, Math.round(4 * m * regionMultiplier)), color: "#f97316" },
      { type: "Lost Item", count: Math.max(0, Math.round(3 * m * regionMultiplier)), color: "#3b82f6" },
      { type: "Dispute", count: Math.max(0, Math.round(3 * m * regionMultiplier)), color: "#a855f7" },
    ];
  }, [period, selectedRegion]);

  const INCIDENT_CITIES = useMemo(
    () => {
      const m = periodMultiplier[period] ?? 1;
      let cities = BASE_INCIDENT_CITIES;
      
      // Filter by region if not "All Regions"
      if (selectedRegion !== 'All Regions') {
        cities = cities.filter(city => {
          if (selectedRegion === 'East Africa') {
            return city.region === 'East Africa';
          } else if (selectedRegion === 'West Africa') {
            return city.region === 'West Africa';
          }
          return true;
        });
      }
      
      return cities.map((city) => {
        // Vary incidents by region to simulate different data
        const regionMultiplier = city.region === 'East Africa' ? 1.2 : 0.8;
        return { ...city, incidents: Math.max(0, Math.round(city.incidents * m * regionMultiplier)) };
      });
    },
    [period, selectedRegion],
  );

  return (
    <Box>
      {/* Header / Title */}
      <Box className="pb-4 flex items-center justify-between gap-2 flex-wrap">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Safety Overview
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Incidents, SOS activity and users under review across all regions.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Categories in dropdowns as requested */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              displayEmpty
              sx={{ fontSize: 12, borderRadius: 2, bgcolor: 'background.paper', height: 40 }}
            >
              <MenuItem value="All Regions">All Regions</MenuItem>
              <MenuItem value="East Africa">East Africa</MenuItem>
              <MenuItem value="West Africa">West Africa</MenuItem>
            </Select>
          </FormControl>
          <PeriodSelector value={period} onChange={handlePeriodChange} />
        </Box>
      </Box>

      {/* KPI row */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {INCIDENT_KPIS.map((kpi) => (
          <Card
            key={kpi.label}
            elevation={2}
            onClick={() => navigate('/admin/risk')}
            sx={{
              borderRadius: 2,
              border: "1px solid rgba(148,163,184,0.3)",
              bgcolor: "background.paper",
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
                borderColor: 'primary.main',
              }
            }}
          >
            <CardContent className="p-3 flex flex-col gap-1">
              <Typography
                variant="caption"
                className="text-[11px] uppercase tracking-wide text-slate-500"
              >
                {kpi.label}
              </Typography>
              <Typography
                variant="h6"
                className="font-semibold text-lg"
                color="text.primary"
              >
                {kpi.value}
              </Typography>
              <Typography
                variant="caption"
                className="text-[11px] text-amber-700"
              >
                {kpi.note}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box className="flex flex-col lg:flex-row gap-4 mb-4">
        {/* Incident distribution card */}
        <Card
          elevation={2}
          sx={{
            flex: 2,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "linear-gradient(145deg, #0b1120, #020617)",
            color: "#e5e7eb",
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2 h-[350px]">
            <Box className="flex items-center justify-between">
              <Typography
                variant="subtitle2"
                className="font-semibold text-slate-50"
              >
                Incident Distribution {selectedRegion !== 'All Regions' ? `(${selectedRegion})` : ''}
              </Typography>
              <Button
                variant="text"
                size="small"
                sx={{ textTransform: "none", fontSize: 11, color: "#93c5fd" }}
                onClick={handleSeeMoreIncidents}
              >
                See full incidents
              </Button>
            </Box>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                <XAxis type="number" fontSize={11} stroke="#94a3b8" />
                <YAxis dataKey="type" type="category" fontSize={11} stroke="#94a3b8" width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: "#e5e7eb" }}
                />
                <Bar dataKey="count" name="Incidents" radius={[0, 4, 4, 0]}>
                  {incidentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Incidents by city */}
        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography
              variant="subtitle2"
              className="font-semibold"
              color="text.primary"
            >
              Incidents by city {selectedRegion !== 'All Regions' ? `(${selectedRegion})` : ''}
            </Typography>
            <Divider className="!my-1" />
            <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>City</TableCell>
                    <TableCell>Region</TableCell>
                    <TableCell align="right">Incidents</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {INCIDENT_CITIES.map((row) => (
                    <TableRow
                      key={row.city}
                      hover
                      onClick={() => handleCityClick(row.city)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{row.city}</TableCell>
                      <TableCell>{row.region}</TableCell>
                      <TableCell align="right">{row.incidents}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Users under review */}
        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Box className="flex items-center justify-between">
              <Typography
                variant="subtitle2"
                className="font-semibold"
                color="text.primary"
              >
                Users under review ({usersUnderReview.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<QueueIcon fontSize="small" />}
                onClick={handleViewQueue}
                sx={{ textTransform: "none", fontSize: 11, borderRadius: 2 }}
              >
                View queue
              </Button>
            </Box>
            <Divider className="!my-1" />
            {usersUnderReview.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No users under review
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  All users have been approved
                </Typography>
              </Box>
            ) : (
              <Box className="flex flex-col gap-2 text-[12px] text-slate-800" sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {usersUnderReview.map((u) => (
                  <Box
                    key={`${u.type}-${u.id}`}
                    className="flex flex-col rounded-md px-2 py-2 hover:bg-black/5 cursor-pointer"
                    onClick={() => handleUserClick(u)}
                  >
                    <Box className="flex items-center justify-between">
                      <Box className="flex items-center gap-2">
                        <span className="font-medium">{u.name}</span>
                        <Chip
                          size="small"
                          label={u.riskLevel}
                          color={getRiskColor(u.riskLevel)}
                          sx={{ fontSize: 9, height: 18, fontWeight: 600 }}
                        />
                      </Box>
                      <Box className="flex items-center gap-1">
                        <Chip
                          size="small"
                          label={u.type}
                          sx={{ fontSize: 10, height: 20 }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={(e) => handleApproveUser(u, e)}
                          sx={{ fontSize: 9, minWidth: 'auto', px: 1, py: 0.25, height: 20, textTransform: 'none' }}
                        >
                          Approve
                        </Button>
                      </Box>
                    </Box>
                    <span className="text-[11px] text-slate-600">
                      {u.city} · {u.reason}
                    </span>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Notes / playbook */}
        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.3)",
            bgcolor: "background.paper"
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Typography
              variant="subtitle2"
              className="font-semibold"
              color="text.primary"
            >
              Safety playbook (notes)
            </Typography>
            <Divider className="!my-1" />
            <Typography
              variant="body2"
              className="text-[12px] text-slate-700"
            >
              • Critical incidents must be acknowledged within 5 minutes and
              fully handled within 24 hours.
            </Typography>
            <Typography
              variant="body2"
              className="text-[12px] text-slate-700"
            >
              • Drivers flagged by the system (high cancellations, repeated
              complaints) should be routed through retraining before
              reactivation.
            </Typography>
            <Typography
              variant="body2"
              className="text-[12px] text-slate-700"
            >
              • Riders exhibiting abuse or fraud patterns should be escalated to
              risk for review and possible ban.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
