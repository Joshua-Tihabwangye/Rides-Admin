// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
} from "@mui/material";

// F4 – Promotions & Incentives (Light/Dark, EVzone themed)
// Route suggestion: /admin/promos
// Configures rider promotions and driver incentives with a shared rule builder
// pattern (eligibility + reward definition).
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle "Promotions & Incentives".
//    - Tabs show "Rider promotions" and "Driver incentives"; first tab is
//      selected.
//    - Summary card shows counts of demo campaigns.
//    - Rule builder shows fields for Audience, Trigger, Count, Time window,
//      Reward type and Reward value.
// 2) Theme toggle
//    - Toggle Light/Dark using the header button; cards and background update
//      while tab state and rule values remain intact.
// 3) Tabs
//    - Switch between Rider promotions and Driver incentives; rule builder
//      subtitle updates to indicate which context you are configuring.
// 4) Rule editing
//    - Change Audience/Trigger/Reward fields; click "Preview rule" and
//      "Save rule"; expect console logs with the current rule state.
// 5) Campaign list interaction
//    - Clicking a campaign card logs which campaign was clicked; in your real
//      app this would open a detail view.

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

function AdminPromotionsLayout({ children }) {
  const [mode, setMode] = useState("light");
  const isDark = mode === "dark";

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <Box
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-900"
      }`}
      sx={{
        background: isDark
          ? `radial-gradient(circle at top left, ${EV_COLORS.primary}18, #020617), radial-gradient(circle at bottom right, ${EV_COLORS.secondary}10, #020617)`
          : `radial-gradient(circle at top left, ${EV_COLORS.primary}12, #ffffff), radial-gradient(circle at bottom right, ${EV_COLORS.secondary}08, #f9fafb)`,
      }}
    >
      {/* Header */}
      <Box className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <Box>
          <Typography
            variant="subtitle2"
            className={`tracking-[0.25em] uppercase text-[11px] ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            EVZONE ADMIN
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Promotions & Incentives
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Chip
            size="small"
            label="Campaigns"
            sx={{
              bgcolor: "#eef2ff",
              borderColor: "#c7d2fe",
              color: "#1e3a8a",
              fontSize: 10,
            }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={toggleMode}
            sx={{
              textTransform: "none",
              borderRadius: 999,
              borderColor: isDark ? "#1f2937" : "#e5e7eb",
              color: isDark ? "#e5e7eb" : "#374151",
              px: 1.8,
              py: 0.4,
              fontSize: 11,
              minWidth: "auto",
            }}
          >
            {isDark ? "Dark" : "Light"}
          </Button>
        </Box>
      </Box>

      {/* Title */}
      <Box className="px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className={`font-semibold tracking-tight ${
              isDark ? "text-slate-50" : "text-slate-900"
            }`}
          >
            Promotions & Incentives
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Configure rider-facing promo codes and driver incentives per
            region, with rules that control eligibility.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col px-4 sm:px-6 pb-6 gap-3">
        {children}
      </Box>
    </Box>
  );
}

const DEMO_CAMPAIGNS = {
  rider: [
    {
      id: "PROMO-NEW-UG",
      name: "Welcome rides Uganda",
      segment: "New riders",
      reward: "50% off first 3 rides",
    },
    {
      id: "PROMO-OFFPEAK",
      name: "Off-peak discount",
      segment: "All riders",
      reward: "10% off rides 10am–3pm",
    },
  ],
  driver: [
    {
      id: "INCENTIVE-PEAK",
      name: "Peak hours bonus",
      segment: "Active drivers",
      reward: "Bonus after 10 peak trips",
    },
    {
      id: "INCENTIVE-EV",
      name: "EV utilisation boost",
      segment: "EV drivers",
      reward: "Extra bonus for 95% EV-only hours",
    },
  ],
};

function RuleBuilder({ contextLabel }) {
  const [rule, setRule] = useState({
    audience: "New riders",
    trigger: "Trip completed",
    minTrips: 1,
    window: "7d",
    rewardType: "Percent discount",
    rewardValue: "10",
  });

  const handleChange = (field) => (event) => {
    setRule((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleNumberChange = (field) => (event) => {
    const value = Number(event.target.value || 0);
    setRule((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreview = () => {
    console.log("Promo rule preview:", rule);
  };

  const handleSave = () => {
    console.log("Promo rule saved:", rule, "for context:", contextLabel);
  };

  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: 8,
        border: "1px solid rgba(148,163,184,0.5)",
        background: "linear-gradient(145deg, #f9fafb, #ffffff)",
      }}
    >
      <CardContent className="p-4 flex flex-col gap-3">
        <Typography
          variant="subtitle2"
          className="font-semibold text-slate-900"
        >
          Rule & eligibility builder ({contextLabel})
        </Typography>
        <Typography
          variant="caption"
          className="text-[11px] text-slate-500"
        >
          Define who qualifies and what reward they receive. This pattern can
          be reused for other policy rules.
        </Typography>

        <Box className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <Box className="flex flex-col gap-1">
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Audience
            </Typography>
            <Select
              size="small"
              value={rule.audience}
              onChange={handleChange("audience")}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
            >
              <MenuItem value="New riders">New riders</MenuItem>
              <MenuItem value="All riders">All riders</MenuItem>
              <MenuItem value="Churned riders">
                Churned riders (no trips in 30d)
              </MenuItem>
              <MenuItem value="EV drivers">EV drivers</MenuItem>
            </Select>
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Trigger
            </Typography>
            <Select
              size="small"
              value={rule.trigger}
              onChange={handleChange("trigger")}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
            >
              <MenuItem value="Trip completed">Trip completed</MenuItem>
              <MenuItem value="X trips in window">
                X trips within time window
              </MenuItem>
              <MenuItem value="Signup">Signup</MenuItem>
            </Select>
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Min trips in window
            </Typography>
            <TextField
              size="small"
              type="number"
              value={rule.minTrips}
              onChange={handleNumberChange("minTrips")}
              inputProps={{ min: 1 }}
              sx={{
                "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" },
                "& .MuiInputBase-input": { fontSize: 12 },
              }}
            />
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Time window
            </Typography>
            <Select
              size="small"
              value={rule.window}
              onChange={handleChange("window")}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
            >
              <MenuItem value="24h">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
            </Select>
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Reward type
            </Typography>
            <Select
              size="small"
              value={rule.rewardType}
              onChange={handleChange("rewardType")}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" } }}
            >
              <MenuItem value="Percent discount">Percent discount</MenuItem>
              <MenuItem value="Fixed amount">Fixed amount off</MenuItem>
              <MenuItem value="Bonus payout">Bonus payout (drivers)</MenuItem>
            </Select>
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Reward value
            </Typography>
            <TextField
              size="small"
              value={rule.rewardValue}
              onChange={handleChange("rewardValue")}
              placeholder="e.g. 10 or 5.00"
              sx={{
                "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" },
                "& .MuiInputBase-input": { fontSize: 12 },
              }}
            />
          </Box>
        </Box>

        <Box className="flex items-center justify-between mt-1">
          <Typography
            variant="caption"
            className="text-[11px] text-slate-500"
          >
            Example: IF {rule.audience} completes {rule.minTrips} trips in {" "}
            {rule.window}, THEN apply {rule.rewardValue}
            {rule.rewardType === "Percent discount" ? "% discount" : ""}.
          </Typography>
          <Box className="flex gap-1">
            <Button
              variant="outlined"
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                fontSize: 12,
              }}
              onClick={handlePreview}
            >
              Preview rule
            </Button>
            <Button
              variant="contained"
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                fontSize: 12,
                bgcolor: EV_COLORS.primary,
                "&:hover": { bgcolor: "#0fb589" },
              }}
              onClick={handleSave}
            >
              Save rule
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function PromotionsIncentivesPage() {
  const [tab, setTab] = useState("rider");

  const handleTabChange = (event, value) => {
    setTab(value === 0 ? "rider" : "driver");
  };

  const campaigns = tab === "rider" ? DEMO_CAMPAIGNS.rider : DEMO_CAMPAIGNS.driver;

  const handleCampaignClick = (campaign) => {
    console.log("Open campaign detail: ", campaign);
  };

  return (
    <AdminPromotionsLayout>
      {/* Tabs + summary */}
      <Card
        elevation={1}
        sx={{
          borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.5)",
          background: "#ffffff",
        }}
      >
        <CardContent className="p-0 flex flex-col">
          <Tabs
            value={tab === "rider" ? 0 : 1}
            onChange={handleTabChange}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab
              label="Rider promotions"
              sx={{ textTransform: "none", fontSize: 13 }}
            />
            <Tab
              label="Driver incentives"
              sx={{ textTransform: "none", fontSize: 13 }}
            />
          </Tabs>

          <Divider />

          <Box className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                elevation={0}
                sx={{
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.4)",
                  background: "linear-gradient(145deg, #f9fafb, #ffffff)",
                  cursor: "pointer",
                }}
                onClick={() => handleCampaignClick(campaign)}
              >
                <CardContent className="p-3 flex flex-col gap-1">
                  <Typography
                    variant="caption"
                    className="text-[11px] text-slate-500"
                  >
                    {campaign.id}
                  </Typography>
                  <Typography
                    variant="body2"
                    className="text-[13px] font-semibold text-slate-900"
                  >
                    {campaign.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-[11px] text-slate-500"
                  >
                    {campaign.segment}
                  </Typography>
                  <Typography
                    variant="body2"
                    className="text-[12px] text-slate-700"
                  >
                    {campaign.reward}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Rule builder */}
      <RuleBuilder
        contextLabel={tab === "rider" ? "Rider promotions" : "Driver incentives"}
      />
    </AdminPromotionsLayout>
  );
}
