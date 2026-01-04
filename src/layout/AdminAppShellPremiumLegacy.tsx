// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

// Premium EVzone Admin App Shell
// -------------------------------
// This is a state-of-the-art shell for the EVzone Admin portal. It provides:
// - A left navigation drawer with sectioned nav groups and active-state styling
// - A glassy top AppBar with global search, language/currency controls and
//   theme toggle
// - Light/Dark mode at the shell level
// - Routing for all major admin pages (currently using Placeholder components;
//   replace these with your generated page components).
//
// Manual test cases (shell-specific):
// 1) Layout
//    - App loads with left navigation, top bar and a main content area.
//    - On /admin/home route, the Home placeholder should be visible.
// 2) Navigation
//    - Clicking a nav item (e.g. Riders) updates the URL and main content.
//    - Active nav item should show a subtle left gradient bar and a soft
//      background tint.
// 3) Global search
//    - Typing a query and pressing Enter should navigate to
//      /admin/search?query=<your query>.
// 4) Theme toggle
//    - Clicking the Dark/Light toggle in the header flips the shell between
//      light and dark palettes. Navigation and search remain readable.
// 5) Language & currency controls
//    - Changing language/currency selects updates local state without errors.
// 6) 404 route
//    - Visiting an unknown route (e.g. /admin/unknown) should show a 404
//      placeholder with a button back to Home.

const EV_COLORS = {
  primary: "#03cd8c", // EVzone Green
  secondary: "#f77f00", // EVzone Orange
};

const drawerWidth = 260;

const NAV_SECTIONS = [
  {
    id: "overview",
    label: "Overview & Ops",
    items: [
      { label: "Home", to: "/admin/home" },
      { label: "Global Search", to: "/admin/search" },
      { label: "Safety overview", to: "/admin/safety" },
    ],
  },
  {
    id: "people",
    label: "People",
    items: [
      { label: "Riders", to: "/admin/riders" },
      { label: "Drivers", to: "/admin/drivers" },
      { label: "Agents", to: "/admin/agents" },
      { label: "Admin users", to: "/admin/admin-users" },
      { label: "Roles & permissions", to: "/admin/roles" },
    ],
  },
  {
    id: "companies",
    label: "Companies & Payouts",
    items: [
      { label: "Companies", to: "/admin/companies" },
      { label: "Payouts", to: "/admin/companies/1/payouts" },
    ],
  },
  {
    id: "services",
    label: "Services & Pricing",
    items: [
      { label: "Service config", to: "/admin/services" },
      { label: "Zones & geofences", to: "/admin/zones" },
      { label: "Company payouts", to: "/admin/companies/1/payouts" },
      { label: "Taxes & invoicing", to: "/admin/finance/tax-invoices" },
    ],
  },
  {
    id: "system",
    label: "System & Risk",
    items: [
      { label: "Integrations", to: "/admin/system/integrations" },
      { label: "System overview", to: "/admin/system/overview" },
      { label: "Audit log", to: "/admin/system/audit-log" },
      { label: "Risk & fraud", to: "/admin/safety" },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [{ label: "My profile", to: "/admin/profile" }],
  },
];

function Placeholder({ title }) {
  return (
    <Box className="p-6">
      <Typography variant="h5" className="font-semibold mb-2">
        {title}
      </Typography>
      <Typography variant="body2" className="text-slate-600">
        This is a placeholder. Replace with your generated page component.
      </Typography>
    </Box>
  );
}

export default function AdminAppShell() {
  const [mode, setMode] = useState("light");
  const isDark = mode === "dark";

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <Router>
      <Box
        className={`min-h-screen flex ${
          isDark ? "bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-900"
        }`}
      >
        {/* Side navigation */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: "1px solid #e5e7eb",
              background: isDark
                ? "linear-gradient(180deg, #020617, #020617)"
                : "linear-gradient(180deg, #ffffff, #f9fafb)",
            },
          }}
        >
          <Box className="flex items-center gap-2 px-4 py-3">
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "999px",
                bgcolor: EV_COLORS.primary,
                boxShadow: "0 0 0 4px rgba(3,205,140,0.18)",
              }}
            />
            <Box className="flex flex-col">
              <Typography
                variant="subtitle2"
                className="tracking-[0.25em] uppercase text-[11px] text-slate-500"
              >
                EVZONE
              </Typography>
              <Typography variant="caption" className="text-[11px]">
                Admin Portal
              </Typography>
            </Box>
          </Box>
          <Divider />
          <Box className="flex-1 overflow-y-auto py-3">
            {NAV_SECTIONS.map((section) => (
              <Box key={section.id} className="mb-4">
                <Typography
                  variant="overline"
                  className="px-4 text-[10px] tracking-[0.16em] text-slate-500"
                >
                  {section.label}
                </Typography>
                <List disablePadding>
                  {section.items.map((item) => (
                    <NavItem key={item.to} to={item.to} label={item.label} />
                  ))}
                </List>
              </Box>
            ))}
          </Box>
        </Drawer>

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: `${drawerWidth}px`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ShellAppBar isDark={isDark} toggleMode={toggleMode} />
          {/* Optional: breadcrumb bar could go here */}
          <Box className="flex-1 overflow-y-auto bg-transparent">
            <Routes>
              {/* Auth & onboarding */}
              <Route
                path="/admin/login"
                element={<Placeholder title="Admin Login (A1)" />}
              />
              <Route
                path="/admin/onboarding/welcome"
                element={
                  <Placeholder title="Admin Welcome & Responsibility (A3)" />
                }
              />
              <Route
                path="/admin/onboarding/checklist"
                element={
                  <Placeholder title="Admin Onboarding Checklist (A4)" />
                }
              />

              {/* Core admin */}
              <Route
                path="/admin/home"
                element={<Placeholder title="Home · Global Dashboard" />}
              />
              <Route
                path="/admin/profile"
                element={<Placeholder title="Profile & Region Settings" />}
              />
              <Route
                path="/admin/search"
                element={<Placeholder title="Global Search" />}
              />

              {/* People */}
              <Route
                path="/admin/riders"
                element={<Placeholder title="Rider Management" />}
              />
              <Route
                path="/admin/drivers"
                element={<Placeholder title="Driver Management" />}
              />
              <Route
                path="/admin/agents"
                element={<Placeholder title="Agent Management" />}
              />
              <Route
                path="/admin/admin-users"
                element={<Placeholder title="Admin Users Management" />}
              />
              <Route
                path="/admin/roles"
                element={<Placeholder title="Roles & Permissions" />}
              />

              {/* Companies & payouts */}
              <Route
                path="/admin/companies"
                element={<Placeholder title="Company List" />}
              />
              <Route
                path="/admin/companies/:companyId"
                element={<Placeholder title="Company Detail" />}
              />
              <Route
                path="/admin/companies/:companyId/payouts"
                element={
                  <Placeholder title="Company Payout Config & History" />
                }
              />

              {/* Services & pricing */}
              <Route
                path="/admin/services"
                element={<Placeholder title="Service Configuration" />}
              />
              <Route
                path="/admin/zones"
                element={<Placeholder title="Zone & Geofence Management" />}
              />
              <Route
                path="/admin/finance/tax-invoices"
                element={<Placeholder title="Taxes & Invoicing" />}
              />

              {/* Safety & risk */}
              <Route
                path="/admin/safety"
                element={<Placeholder title="Safety Overview" />}
              />
              <Route
                path="/admin/safety/risk"
                element={<Placeholder title="Risk & Fraud Center" />}
              />

              {/* System & integrations */}
              <Route
                path="/admin/system/integrations"
                element={<Placeholder title="Integrations" />}
              />
              <Route
                path="/admin/system/audit-log"
                element={<Placeholder title="Audit Log" />}
              />
              <Route
                path="/admin/system/overview"
                element={<Placeholder title="System Health & Config Overview" />}
              />

              {/* Fallback 404 */}
              <Route
                path="*"
                element={
                  <Box className="p-6">
                    <Typography variant="h5" className="font-semibold mb-2">
                      404 – Not found
                    </Typography>
                    <Typography
                      variant="body2"
                      className="text-slate-600 mb-4"
                    >
                      The page you are looking for does not exist.
                    </Typography>
                    <Button
                      variant="contained"
                      sx={{ textTransform: "none" }}
                      onClick={() => (window.location.href = "/admin/home")}
                    >
                      Go to Home
                    </Button>
                  </Box>
                }
              />
            </Routes>
          </Box>
        </Box>
      </Box>
    </Router>
  );
}

function NavItem({ to, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <ListItemButton
      component={NavLink}
      to={to}
      sx={{
        position: "relative",
        borderRadius: 999,
        mx: 1,
        mb: 0.5,
        minHeight: 36,
        px: 2,
        color: isActive ? "#020617" : "#4b5563",
        backgroundColor: isActive ? EV_COLORS.primary + "1A" : "transparent",
        "&::before": isActive
          ? {
              content: '""',
              position: "absolute",
              left: 6,
              top: 6,
              bottom: 6,
              width: 3,
              borderRadius: 999,
              background: `linear-gradient(180deg, ${EV_COLORS.primary}, ${EV_COLORS.secondary})`,
            }
          : {},
        "&:hover": {
          backgroundColor: isActive ? EV_COLORS.primary + "26" : "#e5e7eb",
        },
      }}
    >
      <ListItemText
        primary={label}
        primaryTypographyProps={{
          fontSize: 13,
          fontWeight: isActive ? 600 : 500,
        }}
      />
    </ListItemButton>
  );
}

function ShellAppBar({ isDark, toggleMode }) {
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("USD");
  const navigate = useNavigate();

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = search.trim();
    if (!trimmed) return;
    navigate(`/admin/search?query=${encodeURIComponent(trimmed)}`);
    setSearch("");
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: isDark ? "#020617f7" : "#fffffffa",
        color: isDark ? "#e5e7eb" : "#0f172a",
        borderBottom: isDark ? "1px solid #1f2937" : "1px solid #e5e7eb",
        backdropFilter: "blur(14px)",
        boxShadow: isDark
          ? "0 10px 30px rgba(15,23,42,0.7)"
          : "0 10px 30px rgba(15,23,42,0.08)",
      }}
    >
      <Toolbar
        sx={{
          minHeight: 60,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box className="flex items-center gap-2">
          <Typography variant="h6" className="font-semibold">
            EVzone Admin
          </Typography>
          <Chip
            size="small"
            label="Production"
            sx={{
              height: 22,
              borderRadius: 999,
              bgcolor: "#fee2e2",
              color: "#7f1d1d",
              fontSize: 11,
              fontWeight: 500,
            }}
          />
        </Box>

        {/* Global search */}
        <Box className="flex-1 flex items-center justify-center px-2">
          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{ width: "100%", maxWidth: 640 }}
          >
            <TextField
              size="small"
              placeholder="Search riders, drivers, companies, trips…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      type="submit"
                      size="small"
                      sx={{
                        textTransform: "none",
                        borderRadius: 999,
                        fontSize: 11,
                        px: 1.8,
                        bgcolor: EV_COLORS.primary,
                        "&:hover": { bgcolor: "#0fb589" },
                      }}
                      variant="contained"
                    >
                      Search
                    </Button>
                  </InputAdornment>
                ),
              }}
              sx={{
                width: "100%",
                "& .MuiOutlinedInput-root": {
                  borderRadius: 999,
                  bgcolor: isDark ? "#020617" : "#f3f4f6",
                  "& fieldset": {
                    borderColor: "transparent",
                  },
                  "&:hover fieldset": {
                    borderColor: EV_COLORS.primary,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: EV_COLORS.primary,
                  },
                },
                "& .MuiInputBase-input::placeholder": {
                  fontSize: 12,
                },
              }}
            />
          </Box>
        </Box>

        {/* Right side controls */}
        <Box className="flex items-center gap-2">
          <Select
            size="small"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            sx={{
              minWidth: 80,
              "& .MuiOutlinedInput-root": {
                borderRadius: 999,
                bgcolor: "#f9fafb",
                "& fieldset": { borderColor: "#e5e7eb" },
              },
            }}
          >
            <MenuItem value="en">EN</MenuItem>
            <MenuItem value="fr">FR</MenuItem>
            <MenuItem value="sw">SW</MenuItem>
          </Select>
          <Select
            size="small"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            sx={{
              minWidth: 80,
              "& .MuiOutlinedInput-root": {
                borderRadius: 999,
                bgcolor: "#f9fafb",
                "& fieldset": { borderColor: "#e5e7eb" },
              },
            }}
          >
            <MenuItem value="USD">USD</MenuItem>
            <MenuItem value="EUR">EUR</MenuItem>
            <MenuItem value="UGX">UGX</MenuItem>
          </Select>
          <Chip
            size="small"
            label="AA"
            sx={{
              bgcolor: EV_COLORS.primary,
              color: "#020617",
              fontWeight: 600,
              borderRadius: 999,
              px: 0.5,
            }}
          />
          <Button
            variant="outlined"
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: 999,
              borderColor: isDark ? "#1f2937" : "#e5e7eb",
              color: isDark ? "#e5e7eb" : "#374151",
              fontSize: 11,
            }}
            onClick={toggleMode}
          >
            {isDark ? "Light mode" : "Dark mode"}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
