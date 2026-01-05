// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
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

  const calculateMatches = (category: string) => {
    // Simple static match counts since this page now only acts as a navigation hub.
    return category === "Riders" ? 23 : category === "Drivers" ? 8 : 4;
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

      {/* No standalone search field here – use the cards below to jump into the relevant modules */}

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
