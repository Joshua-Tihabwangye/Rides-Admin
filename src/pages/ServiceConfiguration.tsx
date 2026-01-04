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
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";

// F1 – Service Configuration (Light/Dark, EVzone themed)
// Route suggestion: /admin/services
// Defines what services exist in which countries/cities (Ride, Delivery,
// Rental, School shuttle, Tours, EMS, etc.)
//
// Manual test cases:
// 1) Initial render
//    - Light mode by default.
//    - Header shows EVZONE ADMIN and subtitle "Core product config · Services".
//    - Title "Service Configuration" with descriptive subtitle.
//    - Country select shows at least Uganda and Kenya.
//    - City chips for the selected country are visible (e.g. Kampala, Entebbe).
//    - For the active city, a list of service toggles is shown.
// 2) Theme toggle
//    - Toggle Light/Dark using the header button; layout and state remain
//      stable while colours change.
// 3) Country & city selection
//    - Change country in the select; city chips update accordingly.
//    - Click different city chips; the services list updates to that city.
// 4) Service toggles
//    - Toggle Ride/Delivery/Rental/etc. switches; expect local state to update
//      and a console log showing the new state for that city.
// 5) Save configuration (demo)
//    - Click "Save configuration"; expect a console log with the full
//      in-memory serviceConfig object.

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
  const [mode, setMode] = useState("light");
  const isDark = mode === "dark";

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <Box
      className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? "bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-900"
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
            className={`tracking-[0.25em] uppercase text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"
              }`}
          >
            EVZONE ADMIN
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"
              }`}
          >
            Core product config · Services
          </Typography>
        </Box>
        <Box className="flex items-center gap-2">
          <Chip
            size="small"
            label="Services"
            sx={{
              bgcolor: "#ecfdf5",
              borderColor: "#bbf7d0",
              color: "#14532d",
              fontSize: 10,
            }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={toggleMode}
            sx={{
              textTransform: "none",
              borderRadius: 2,
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
            className={`font-semibold tracking-tight ${isDark ? "text-slate-50" : "text-slate-900"
              }`}
          >
            Service Configuration
          </Typography>
          <Typography
            variant="caption"
            className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"
              }`}
          >
            Enable and disable services per country and city. This drives what
            appears in the Rider and Driver apps.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col px-4 sm:px-6 pb-6 gap-3">
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
      console.log("Updated services for", country, city, cityConfig);
      return next;
    });
  };

  const handleSave = () => {
    console.log("Saving service configuration:", serviceConfig);
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
              sx={{
                textTransform: "none",
                borderRadius: 2,
                fontSize: 12,
                bgcolor: EV_COLORS.primary,
                "&:hover": { bgcolor: "#0fb589" },
              }}
              onClick={handleSave}
            >
              Save configuration
            </Button>
          </Box>
        </CardContent>
      </Card>
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
