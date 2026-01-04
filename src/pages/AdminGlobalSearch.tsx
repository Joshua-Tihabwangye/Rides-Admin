// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Divider,
} from "@mui/material";

// B1 – Global Search (v2, tighter card corners)
// Route: /admin/search

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};





import { useNavigate } from "react-router-dom";

export default function AdminGlobalSearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [recentQueries, setRecentQueries] = useState([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Mock data for search suggestions
  const mockDatabase = [
    "Rider: John Okello (0700000000)",
    "Rider: Jane Doe (0711111111)",
    "Driver: Michael Driver (KV 1234)",
    "Driver: Sarah K (KV 5678)",
    "Company: GreenMove Fleet",
    "Company: Sunrise Logistics",
    "Trip: #TR-12345",
    "Trip: #TR-67890",
    "Incident: #INC-54321"
  ];

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (!val) {
      setSuggestions([]);
      return;
    }

    // Logic: if digit is typed, show words with that digit?
    // User asked: "if i type in a digit it should bring/ disply the words that have that digit"
    // Also generally search suggestions.

    const matches = mockDatabase.filter(item =>
      item.toLowerCase().includes(val.toLowerCase())
    );
    setSuggestions(matches.slice(0, 5));
  };

  const calculateMatches = (category: string) => {
    // Mock match counts based on query
    if (!query) return 0;
    return category === 'Riders' ? 23 : category === 'Drivers' ? 8 : 4;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    console.log("Global search submit (B1 page):", trimmed);
    setRecentQueries((prev) => {
      const next = [trimmed, ...prev.filter((q) => q !== trimmed)];
      return next.slice(0, 5);
    });
    setSuggestions([]); // Clear suggestions on submit
  };

  const handleChipClick = (q) => {
    setQuery(q);
    setSuggestions([]);
  };

  return (
    <Box>
      {/* Title */}
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Global Search
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Find riders, drivers, companies, trips and incidents across all
            regions.
          </Typography>
        </Box>
      </Box>

      {/* Search bar */}
      <Box className="max-w-2xl w-full mx-auto mb-4 relative">
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, phone, email, trip ID, plate, incident ID…"
            value={query}
            onChange={handleQueryChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    type="submit"
                    size="small"
                    variant="contained"
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      fontSize: 11,
                      px: 1.8,
                      bgcolor: EV_COLORS.primary,
                      "&:hover": { bgcolor: "#0fb589" },
                    }}
                  >
                    Search
                  </Button>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiInputBase-input::placeholder": {
                fontSize: 12,
              },
            }}
          />
        </Box>

        {/* Suggestion Dropdown */}
        {suggestions.length > 0 && (
          <Box sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            boxShadow: 3,
            zIndex: 10,
            borderRadius: 1,
            mt: 0.5,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider'
          }}>
            {suggestions.map((s, i) => (
              <Box key={i}
                onClick={() => { setQuery(s); setSuggestions([]); }}
                sx={{
                  px: 2, py: 1,
                  fontSize: 12,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                {s}
              </Box>
            ))}
          </Box>
        )}

        {recentQueries.length > 0 && (
          <Box className="mt-2 flex flex-wrap gap-1 items-center text-[11px] text-slate-500">
            <span>Recent searches:</span>
            {recentQueries.map((q) => (
              <Chip
                key={q}
                size="small"
                label={q}
                onClick={() => handleChipClick(q)}
                sx={{ fontSize: 10, height: 22 }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Results sections with reduced corner radius */}
      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
        {/* Riders */}
        <Card
          elevation={2}
          onClick={() => navigate('/admin/riders')}
          sx={{
            borderRadius: 2,
            cursor: 'pointer',
            border: `1px solid ${EV_COLORS.primary}44`,
            bgcolor: "background.paper",
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4,
            }
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Box className="flex items-center justify-between">
              <Typography
                variant="subtitle2"
                className="font-semibold"
                color="text.primary"
              >
                Riders
              </Typography>
              <Chip size="small" label={`${calculateMatches('Riders')} matches`} sx={{ fontSize: 10 }} />
            </Box>
            <Divider className="!my-1" />
            <Typography
              variant="caption"
              className="text-[11px] mb-1"
              color="text.secondary"
            >
              Sample results only. In production, results are fetched from the
              search service filtered by your RBAC scopes.
            </Typography>
            <Box className="flex flex-col gap-1 text-[12px]">
              <Box className="flex flex-col rounded-md px-2 py-1 hover:bg-white/80">
                <span className="font-medium">John Okello</span>
                <span className="text-[11px] text-slate-600">
                  Rider · Kampala · +256 700 000 000
                </span>
              </Box>
              <Box className="flex flex-col rounded-md px-2 py-1 hover:bg-white/80">
                <span className="font-medium">Jane Doe</span>
                <span className="text-[11px] text-slate-600">
                  Rider · Nairobi · +254 711 111 111
                </span>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Drivers */}
        <Card
          elevation={2}
          onClick={() => navigate('/admin/drivers')}
          sx={{
            borderRadius: 2,
            cursor: 'pointer',
            border: `1px solid ${EV_COLORS.secondary}44`,
            bgcolor: "background.paper",
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4,
            }
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Box className="flex items-center justify-between">
              <Typography
                variant="subtitle2"
                className="font-semibold"
                color="text.primary"
              >
                Drivers
              </Typography>
              <Chip size="small" label={`${calculateMatches('Drivers')} matches`} sx={{ fontSize: 10 }} />
            </Box>
            <Divider className="!my-1" />
            <Box className="flex flex-col gap-1 text-[12px]">
              <Box className="flex flex-col rounded-md px-2 py-1 hover:bg-white/80">
                <span className="font-medium">Michael Driver</span>
                <span className="text-[11px] text-slate-600">
                  EV Car · Kampala · 4.92 rating
                </span>
              </Box>
              <Box className="flex flex-col rounded-md px-2 py-1 hover:bg-white/80">
                <span className="font-medium">Sarah K.</span>
                <span className="text-[11px] text-slate-600">
                  EV Bike · Lagos · 4.78 rating
                </span>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Companies */}
        <Card
          elevation={2}
          onClick={() => navigate('/admin/companies')}
          sx={{
            borderRadius: 2,
            cursor: 'pointer',
            border: "1px solid rgba(148,163,184,0.6)",
            bgcolor: "background.paper",
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4,
            }
          }}
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <Box className="flex items-center justify-between">
              <Typography
                variant="subtitle2"
                className="font-semibold"
                color="text.primary"
              >
                Companies
              </Typography>
              <Chip size="small" label={`${calculateMatches('Companies')} matches`} sx={{ fontSize: 10 }} />
            </Box>
            <Divider className="!my-1" />
            <Box className="flex flex-col gap-1 text-[12px]">
              <Box className="flex flex-col rounded-md px-2 py-1 hover:bg-white/80">
                <span className="font-medium">GreenMove Fleet</span>
                <span className="text-[11px] text-slate-600">
                  Kampala · 85 drivers · Active
                </span>
              </Box>
              <Box className="flex flex-col rounded-md px-2 py-1 hover:bg-white/80">
                <span className="font-medium">Sunrise Logistics</span>
                <span className="text-[11px] text-slate-600">
                  Accra · 34 drivers · Pending docs
                </span>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
