import React, { useState, useEffect } from"react";
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
  Alert,
  Snackbar,
  CircularProgress,
} from"@mui/material";
import { useNavigate } from"react-router-dom";
import { listAdminPromos, createAdminPromo, patchAdminPromo } from"../services/api/adminApi";
import type { AdminPromoResponse, AdminCreatePromoInput } from"../services/api/adminApi";

const EV_COLORS = {
  primary:"#03cd8c",
  secondary:"#f77f00",
};

function AdminPromotionsLayout({ children }) {
  return (
    <Box>
      <Box className="pb-4 flex items-center justify-between gap-2">
        <Box>
          <Typography
            variant="h6"
            className="font-semibold tracking-tight"
            color="text.primary"
          >
            Promotions & Incentives
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Configure rider-facing promo codes and driver incentives per
            region, with rules that control eligibility.
          </Typography>
        </Box>
      </Box>
      <Box className="flex-1 flex flex-col gap-3">
        {children}
      </Box>
    </Box>
  );
}

type Campaign = {
  id: string;
  name: string;
  segment: string;
  reward: string;
};

export default function PromotionsIncentivesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("rider");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminPromos();
      const mapped: Campaign[] = data.map(promo => ({
        id: promo.id,
        name: promo.code,
        segment: "All users", // backend may not have segment; could add later
        reward: promo.discountType === "percent" ? `${promo.discountValue}% off` : `$${promo.discountValue} off`,
      }));
      setCampaigns(mapped);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleTabChange = (event, value) => {
    setTab(value === 0 ? "rider" : "driver");
  };

  const campaignsByTab = tab === "rider"
    ? campaigns.filter(c => c.id.startsWith("PROMO"))
    : campaigns.filter(c => c.id.startsWith("INCENTIVE"));

  const handleCampaignClick = (campaign) => {
    navigate(`/admin/promos/${campaign.id}`);
  };

  const handleSaveRule = async (rule: any) => {
    try {
      if (tab === "rider") {
        await createAdminPromo({
          code: rule.audience.substring(0, 5).toUpperCase(),
          description: rule.trigger,
          discountType: "percent",
          discountValue: parseInt(rule.rewardValue) || 0,
        });
      } else {
        // For driver incentives, maybe use a different endpoint; for now just create a promo as placeholder
        await createAdminPromo({
          code: `INC-${Date.now()}`,
          description: rule.trigger,
          discountType: "flat",
          discountValue: parseInt(rule.rewardValue) || 0,
        });
      }
      setSnackbarOpen(true);
      fetchCampaigns();
    } catch (e: any) {
      console.error("Failed to save rule:", e);
    }
  };

  return (
    <AdminPromotionsLayout>
      <Card
        elevation={1}
        sx={{
          borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.5)",
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
            {campaignsByTab.map((campaign) => (
              <Card
                key={campaign.id}
                elevation={0}
                sx={{
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.4)",
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
                    className="text-[13px] font-semibold"
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
                    className="text-[12px] text-slate-500"
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
        onSave={handleSaveRule}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          Rule saved successfully!
        </Alert>
      </Snackbar>
    </AdminPromotionsLayout>
  );
}

function RuleBuilder({ contextLabel, onSave }) {
  const [rule, setRule] = useState({
    audience: "New riders",
    trigger: "Trip completed",
    minTrips: "",
    window: "7d",
    rewardType: "Percent discount",
    rewardValue: "",
  });

  const handleChange = (field) => (event) => {
    setRule((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleNumberChange = (field) => (event) => {
    const value = event.target.value;
    setRule((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreview = () => {
    const previewText = `Rule Preview:\n\nIF ${rule.audience} ${rule.trigger === "Trip completed" ? "completes" : rule.trigger === "X trips in window" ? "completes" : "signs up"} ${rule.minTrips} ${Number(rule.minTrips) > 1 ? "trips" : "trip"} in ${rule.window},\nTHEN apply ${rule.rewardValue}${rule.rewardType === "Percent discount" ? "% discount" : rule.rewardType === "Fixed amount" ? " off" : " bonus payout"}.\n\nThis rule will be active for ${contextLabel.toLowerCase()}.`;
    alert(previewText);
  };

  const handleSave = () => {
    onSave(rule);
  };

  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: 8,
        border: "1px solid rgba(148,163,184,0.5)",
        mt: 3,
      }}
    >
      <CardContent className="p-4 flex flex-col gap-3">
        <Typography
          variant="subtitle2"
          className="font-semibold"
        >
          Rule & eligibility builder ({contextLabel})
        </Typography>
        <Typography
          variant="caption"
          className="text-[11px] text-slate-500"
        >
          Define who qualifies and what reward they receive.
        </Typography>

        <Box className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <Box className="flex flex-col gap-1">
            <Typography variant="caption" className="text-[11px] text-slate-500">Audience</Typography>
            <Select size="small" value={rule.audience} onChange={handleChange("audience")} fullWidth>
              <MenuItem value="New riders">New riders</MenuItem>
              <MenuItem value="All riders">All riders</MenuItem>
              <MenuItem value="Churned riders">Churned riders (no trips in 30d)</MenuItem>
              <MenuItem value="EV drivers">EV drivers</MenuItem>
            </Select>
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography variant="caption" className="text-[11px] text-slate-500">Trigger</Typography>
            <Select size="small" value={rule.trigger} onChange={handleChange("trigger")} fullWidth>
              <MenuItem value="Trip completed">Trip completed</MenuItem>
              <MenuItem value="X trips in window">X trips within time window</MenuItem>
              <MenuItem value="Signup">Signup</MenuItem>
            </Select>
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography variant="caption" className="text-[11px] text-slate-500">Min trips in window</Typography>
            <TextField
              size="small"
              type="number"
              value={rule.minTrips}
              onChange={handleNumberChange("minTrips")}
              inputProps={{ min: 1 }}
              placeholder="e.g. 1"
            />
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography variant="caption" className="text-[11px] text-slate-500">Time window</Typography>
            <Select size="small" value={rule.window} onChange={handleChange("window")} fullWidth>
              <MenuItem value="24h">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
            </Select>
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography variant="caption" className="text-[11px] text-slate-500">Reward type</Typography>
            <Select size="small" value={rule.rewardType} onChange={handleChange("rewardType")} fullWidth>
              <MenuItem value="Percent discount">Percent discount</MenuItem>
              <MenuItem value="Fixed amount">Fixed amount off</MenuItem>
              <MenuItem value="Bonus payout">Bonus payout (drivers)</MenuItem>
            </Select>
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography variant="caption" className="text-[11px] text-slate-500">Reward value</Typography>
            <TextField
              size="small"
              value={rule.rewardValue}
              onChange={handleChange("rewardValue")}
              placeholder="e.g. 10 or 5.00"
            />
          </Box>
        </Box>

        <Box className="flex items-center justify-between mt-1">
          <Typography variant="caption" className="text-[11px] text-slate-500">
            Example: IF {rule.audience} completes {rule.minTrips} trips in {rule.window}, THEN apply {rule.rewardValue} {rule.rewardType === "Percent discount" ? "% discount" : ""}.
          </Typography>
          <Box className="flex gap-1">
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: "none", borderRadius: 999, fontSize: 12 }}
              onClick={handlePreview}
            >
              Preview rule
            </Button>
            <Button
              variant="contained"
              size="small"
              sx={{ textTransform: "none", borderRadius: 999, fontSize: 12, bgcolor: EV_COLORS.primary, "&:hover": { bgcolor: "#0fb589" } }}
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
