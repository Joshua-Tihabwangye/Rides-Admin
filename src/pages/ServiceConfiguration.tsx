import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert
} from "@mui/material";

// F1 – Service Configuration (Light/Dark, EVzone themed)
// Route suggestion: /admin/services
// Defines what services exist in which countries/cities (Ride, Delivery,
// Rental, School shuttle, Tours, EMS, etc.)

const EV_COLORS = {
  primary: "#03cd8c",
  secondary: "#f77f00",
};

const INITIAL_SERVICE_CONFIG = {
  Uganda: {
    Kampala: {
      ride: true,
      delivery: true,
      rental: true,
      school: true,
      tours: true,
      ems: true,
    },
    Entebbe: {
      ride: true,
      delivery: true,
      rental: false,
      school: true,
      tours: true,
      ems: true,
    },
  },
  Kenya: {
    Nairobi: {
      ride: true,
      delivery: true,
      rental: true,
      school: false,
      tours: true,
      ems: true,
    },
    Mombasa: {
      ride: true,
      delivery: true,
      rental: false,
      school: false,
      tours: true,
      ems: true,
    },
  },
};

function AdminServicesLayout({ children }) {
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
            Service Configuration
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Enable and disable services per country and city. This drives what
            appears in the Rider and Driver apps.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-3">
        {children}
      </Box>
    </Box>
  );
}

export default function ServiceConfigurationPage() {
  const [serviceConfig, setServiceConfig] = useState(INITIAL_SERVICE_CONFIG);
  const countries = Object.keys(serviceConfig);
  const [country, setCountry] = useState(countries[0] || "Uganda");
  const cities = Object.keys(serviceConfig[country] || {});
  const [city, setCity] = useState(cities[0] || "Kampala");
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCountryChange = (event) => {
    const nextCountry = event.target.value;
    setCountry(nextCountry);
    const nextCities = Object.keys(serviceConfig[nextCountry] || {});
    if (nextCities.length > 0) {
      setCity(nextCities[0]);
    }
  };

  const handleCityClick = (cityName) => {
    setCity(cityName);
  };

  const handleServiceToggle = (serviceKey) => (event) => {
    const checked = event.target.checked;
    setServiceConfig((prev) => {
      const next = { ...prev };
      const countryConfig = { ...next[country] };
      const cityConfig = { ...countryConfig[city] };
      cityConfig[serviceKey] = checked;
      countryConfig[city] = cityConfig;
      next[country] = countryConfig;
      return next;
    });
  };

  const handleSave = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setShowSuccess(true);
      console.log("Saved service configuration:", serviceConfig);
    }, 600);
  };

  const currentConfig = serviceConfig[country]?.[city] || {};

  return (
    <AdminServicesLayout>
      <Card
        elevation={1}
        sx={{
          borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.5)",
          background: "linear-gradient(145deg, #f9fafb, #ffffff)",
        }}
      >
        <CardContent className="p-4 flex flex-col gap-3">
          {/* Country & city selection */}
          <Box className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <Box className="flex items-center gap-2">
              <Typography
                variant="caption"
                className="text-[11px] text-slate-500"
              >
                Country
              </Typography>
              <Select
                size="small"
                value={country}
                onChange={handleCountryChange}
                sx={{
                  minWidth: 160,
                  "& .MuiOutlinedInput-root": { bgcolor: "#ffffff" },
                }}
              >
                {countries.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Box className="flex flex-wrap items-center gap-1 text-[11px]">
              <span className="text-slate-500">Cities:</span>
              {cities.map((c) => (
                <Chip
                  key={c}
                  size="small"
                  label={c}
                  onClick={() => handleCityClick(c)}
                  sx={{
                    fontSize: 10,
                    height: 22,
                    bgcolor: c === city ? "#ecfdf5" : "#f9fafb",
                    borderColor: c === city ? "#bbf7d0" : "#e5e7eb",
                    borderWidth: 1,
                    borderStyle: "solid",
                  }}
                />
              ))}
            </Box>
          </Box>

          <Divider className="!my-1" />

          {/* Services toggles */}
          <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <ServiceToggle
              label="Ride-hailing"
              description="Standard and premium EV rides"
              checked={!!currentConfig.ride}
              onChange={handleServiceToggle("ride")}
            />
            <ServiceToggle
              label="Delivery"
              description="On-demand parcel & food delivery"
              checked={!!currentConfig.delivery}
              onChange={handleServiceToggle("delivery")}
            />
            <ServiceToggle
              label="Rental"
              description="Short and long-term EV rentals"
              checked={!!currentConfig.rental}
              onChange={handleServiceToggle("rental")}
            />
            <ServiceToggle
              label="School shuttles"
              description="School routes and timetabled trips"
              checked={!!currentConfig.school}
              onChange={handleServiceToggle("school")}
            />
            <ServiceToggle
              label="Tours & tourism"
              description="City tours and inter-city trips"
              checked={!!currentConfig.tours}
              onChange={handleServiceToggle("tours")}
            />
            <ServiceToggle
              label="EMS / Ambulance"
              description="Emergency medical services"
              checked={!!currentConfig.ems}
              onChange={handleServiceToggle("ems")}
            />
          </Box>

          <Box className="flex items-center justify-between mt-2">
            <Typography
              variant="caption"
              className="text-[11px] text-slate-500"
            >
              Note: EMS and School shuttles may require additional approvals
              from the Medical or School modules.
            </Typography>
            <Button
              variant="contained"
              size="small"
              disabled={saving}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                fontSize: 12,
                bgcolor: EV_COLORS.primary,
                "&:hover": { bgcolor: "#0fb589" },
              }}
              onClick={handleSave}
            >
              {saving ? 'Saving...' : 'Save configuration'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={showSuccess} autoHideDuration={3000} onClose={() => setShowSuccess(false)}>
        <Alert severity="success" sx={{ width: '100%' }}>
          Configuration saved successfully
        </Alert>
      </Snackbar>
    </AdminServicesLayout>
  );
}

function ServiceToggle({ label, description, checked, onChange }) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 8,
        border: "1px solid rgba(148,163,184,0.5)",
        background: "#ffffff",
      }}
    >
      <CardContent className="p-3 flex items-start justify-between gap-3">
        <Box className="flex flex-col">
          <Typography
            variant="body2"
            className="text-[13px] font-medium text-slate-900"
          >
            {label}
          </Typography>
          <Typography
            variant="caption"
            className="text-[11px] text-slate-500 mt-0.5"
          >
            {description}
          </Typography>
        </Box>
        <FormControlLabel
          control={<Switch size="small" checked={checked} onChange={onChange} />}
          label=""
          sx={{ marginLeft: 0 }}
        />
      </CardContent>
    </Card>
  );
}
