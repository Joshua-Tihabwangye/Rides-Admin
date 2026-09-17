import React, { type ChangeEvent, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useNavigate } from "react-router-dom";
import { createAdminPricingZone } from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03cd8c",
};

const SERVICES = ["Ride", "Delivery", "Rental", "School Shuttle", "EMS / Ambulance", "Tours"];

type ZoneFormData = {
  name: string;
  country: string;
  city: string;
  services: string[];
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function ZoneCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name:"",
    country:"",
    city:"",
    services: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleServicesChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      services: typeof value === "string" ? value.split(",") : value,
    }));
  };

  const handleTextChange = (field: keyof Omit<ZoneFormData, "services">) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.country.trim() || !formData.city.trim()) {
      setError("Zone name, country, and city are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const zone = await createAdminPricingZone({
        name: formData.name.trim(),
        country: formData.country.trim(),
        city: formData.city.trim(),
        services: formData.services,
        status: "active",
        boundaries: { type: "Polygon", coordinates: [] },
      });
      navigate(`/admin/pricing/map/${zone.id}`);
    } catch (error) {
      setError(getErrorMessage(error, "Failed to create zone"));
      setSaving(false);
    }
  };

  return (
    <Box className="p-4 max-w-2xl mx-auto">
      <Card
        elevation={1}
        sx={{
          borderRadius: 4,
          border: "1px solid rgba(148,163,184,0.5)",
        }}
      >
        <CardContent className="p-6 flex flex-col gap-4">
          <Typography variant="h6" className="font-semibold">
            Create New Zone
          </Typography>
          <Typography variant="caption" className="text-slate-500 mb-2">
            Define basic details for a new service zone.
          </Typography>

          <TextField
            label="Zone Name"
            size="small"
            fullWidth
            value={formData.name}
            onChange={handleTextChange("name")}
          />

          <Box className="grid grid-cols-2 gap-4">
            <TextField
              label="Country"
              size="small"
              select
              fullWidth
              value={formData.country}
              onChange={handleTextChange("country")}
            >
            <MenuItem value=""><em>Select country</em></MenuItem>
              <MenuItem value="Uganda">Uganda</MenuItem>
              <MenuItem value="Kenya">Kenya</MenuItem>
              <MenuItem value="Rwanda">Rwanda</MenuItem>
              <MenuItem value="Nigeria">Nigeria</MenuItem>
            </TextField>
            <TextField
              label="City/Region"
              size="small"
              fullWidth
              value={formData.city}
              onChange={handleTextChange("city")}
            />
          </Box>

          <FormControl size="small" fullWidth>
            <InputLabel>Services</InputLabel>
            <Select
              multiple
              value={formData.services}
              onChange={handleServicesChange}
              input={<OutlinedInput label="Services" />}
              renderValue={(selected) => selected.join(", ")}
            >
              {SERVICES.map((name) => (
                <MenuItem key={name} value={name}>
                  <Checkbox checked={formData.services.indexOf(name) > -1} />
                  <ListItemText primary={name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>
          )}

          <Box className="flex justify-end gap-2 mt-4">
            <Button
              variant="outlined"
              onClick={() => navigate("/admin/pricing/zones")}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving || !formData.name.trim() || !formData.country.trim() || !formData.city.trim()}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                bgcolor: EV_COLORS.primary,
                "&:hover": { bgcolor: "#0fb589" },
              }}
            >
              {saving ? "Creating..." : "Create Zone"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
