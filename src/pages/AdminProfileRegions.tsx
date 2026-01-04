// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  Button,
  Switch,
  FormControlLabel,
  Divider,
} from "@mui/material";

// A5 – Admin Profile & Region Settings (v2, tighter card corners)
// Route: /admin/profile
// Inline AdminMainLayoutShell so this canvas is previewable standalone.

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};




export default function AdminProfileRegionSettingsPage() {
  const [profile, setProfile] = useState({
    name: "Alex Admin",
    email: "alex.admin@evzonehq.com",
    phone: "+256 700 000 000",
  });

  const [regions, setRegions] = useState({
    eastAfrica: true,
    westAfrica: false,
    global: false,
  });

  const [limitAssignedOnly, setLimitAssignedOnly] = useState(true);

  const handleProfileChange = (field) => (event) => {
    setProfile((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleRegionToggle = (field) => (event) => {
    setRegions((prev) => ({ ...prev, [field]: event.target.checked }));
  };

  const handleLimitToggle = (event) => {
    setLimitAssignedOnly(event.target.checked);
  };

  const regionChipVariant = (active) =>
    active
      ? {
        bgcolor: "#ecfdf5",
        borderColor: "#bbf7d0",
        color: "#14532d",
      }
      : {
        bgcolor: "action.hover", // Use theme aware color
        borderColor: "divider",
        color: "text.secondary",
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
            Profile · Admin account
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Manage your Admin account, contact details and region access.
          </Typography>
        </Box>
      </Box>

      <Box className="flex flex-col lg:flex-row gap-4">
        {/* Profile card */}
        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.5)",
            // background: "linear-gradient(145deg, #f8fafc, #ffffff)", // Remove fixed gradient
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="subtitle2"
              className="font-semibold mb-1"
              color="text.primary"
            >
              Account details
            </Typography>
            <Box className="flex flex-wrap gap-1 mb-1">
              <Chip
                size="small"
                label="Super Admin"
                sx={{
                  fontSize: 10,
                  height: 22,
                  bgcolor: "#dcfce7",
                  borderColor: "#22c55e",
                  borderWidth: 1,
                  borderStyle: "solid",
                  color: "#14532d",
                }}
              />
              <Chip
                size="small"
                label="Mobility Admin"
                sx={{
                  fontSize: 10,
                  height: 22,
                  bgcolor: "#e0f2fe",
                  borderColor: "#0ea5e9",
                  borderWidth: 1,
                  borderStyle: "solid",
                  color: "#0f172a",
                }}
              />
              <Chip
                size="small"
                label="Finance read-only"
                sx={{
                  fontSize: 10,
                  height: 22,
                  bgcolor: "#fefce8",
                  borderColor: "#facc15",
                  borderWidth: 1,
                  borderStyle: "solid",
                  color: "#78350f",
                }}
              />
            </Box>

            <TextField
              label="Display name"
              value={profile.name}
              onChange={handleProfileChange("name")}
              size="small"
              fullWidth
            />

            <TextField
              label="Work email"
              value={profile.email}
              size="small"
              fullWidth
              InputProps={{ readOnly: true }}
            />

            <TextField
              label="Contact phone"
              value={profile.phone}
              onChange={handleProfileChange("phone")}
              size="small"
              fullWidth
            />

            <Divider className="!my-2" />
            <Typography
              variant="caption"
              className="text-[11px]"
              color="text.secondary"
            >
              Changes to your email and core role require approval by a Super
              Admin or IT security. Display name and phone updates apply
              immediately.
            </Typography>
          </CardContent>
        </Card>

        {/* Region scope card */}
        <Card
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: "1px solid rgba(148,163,184,0.5)",
            // background: "linear-gradient(145deg, #eff6ff, #ffffff)", // Remove fixed gradient
          }}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <Typography
              variant="subtitle2"
              className="font-semibold mb-1"
              color="text.primary"
            >
              Region access
            </Typography>

            <Typography
              variant="caption"
              className="text-[11px] mb-1"
              color="text.secondary"
            >
              These settings control which regions you can see and manage in the
              Admin Portal. Actual enforcement is handled by RBAC and data
              filters server-side.
            </Typography>

            <Box className="flex flex-col gap-2 text-sm">
              <Box className="flex items-center justify-between gap-2">
                <Box>
                  <Typography variant="body2" className="text-[13px]" color="text.primary">
                    East Africa
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-[11px]"
                    color="text.secondary"
                  >
                    Uganda, Kenya, Tanzania, Rwanda
                  </Typography>
                </Box>
                <Box className="flex items-center gap-2">
                  <Chip
                    size="small"
                    label="Core region"
                    sx={{
                      fontSize: 10,
                      height: 22,
                      ...regionChipVariant(regions.eastAfrica),
                    }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={regions.eastAfrica}
                        onChange={handleRegionToggle("eastAfrica")}
                      />
                    }
                    label=""
                  />
                </Box>
              </Box>

              <Box className="flex items-center justify-between gap-2">
                <Box>
                  <Typography variant="body2" className="text-[13px]" color="text.primary">
                    West Africa
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-[11px]"
                    color="text.secondary"
                  >
                    Nigeria, Ghana, Côte d'Ivoire
                  </Typography>
                </Box>
                <Box className="flex items-center gap-2">
                  <Chip
                    size="small"
                    label="Optional"
                    sx={{
                      fontSize: 10,
                      height: 22,
                      ...regionChipVariant(regions.westAfrica),
                    }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={regions.westAfrica}
                        onChange={handleRegionToggle("westAfrica")}
                      />
                    }
                    label=""
                  />
                </Box>
              </Box>

              <Box className="flex items-center justify-between gap-2">
                <Box>
                  <Typography variant="body2" className="text-[13px]" color="text.primary">
                    Global (all regions)
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-[11px]"
                    color="text.secondary"
                  >
                    Reserved for Super Admins and selected executives.
                  </Typography>
                </Box>
                <Box className="flex items-center gap-2">
                  <Chip
                    size="small"
                    label="Sensitive"
                    sx={{
                      fontSize: 10,
                      height: 22,
                      ...regionChipVariant(regions.global),
                    }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={regions.global}
                        onChange={handleRegionToggle("global")}
                      />
                    }
                    label=""
                  />
                </Box>
              </Box>
            </Box>

            <Divider className="!my-2" />

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={limitAssignedOnly}
                  onChange={handleLimitToggle}
                />
              }
              label={
                <Typography
                  variant="body2"
                  className="text-[12px]"
                  color="text.primary"
                >
                  Limit to assigned regions only
                </Typography>
              }
            />

            <Typography
              variant="caption"
              className="text-[11px]"
              color="text.secondary"
            >
              When enabled, data from outside your assigned regions will be
              hidden, even if you previously had broader access.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
