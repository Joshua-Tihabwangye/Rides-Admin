import React, { useMemo, useState } from 'react'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonIcon from '@mui/icons-material/Person'
import SettingsIcon from '@mui/icons-material/Settings'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications'
import AssessmentIcon from '@mui/icons-material/Assessment'
import SearchIcon from '@mui/icons-material/Search'
import PeopleIcon from '@mui/icons-material/People'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import GppBadIcon from '@mui/icons-material/GppBad'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'
import SecurityIcon from '@mui/icons-material/Security'
import BusinessIcon from '@mui/icons-material/Business'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import ReceiptIcon from '@mui/icons-material/Receipt'
import CategoryIcon from '@mui/icons-material/Category'
import MapIcon from '@mui/icons-material/Map'
import PriceChangeIcon from '@mui/icons-material/PriceChange'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import PolicyIcon from '@mui/icons-material/Policy'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import SchoolIcon from '@mui/icons-material/School'
import TranslateIcon from '@mui/icons-material/Translate'
import FlagIcon from '@mui/icons-material/Flag'
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions'
import DnsIcon from '@mui/icons-material/Dns'
import HistoryIcon from '@mui/icons-material/History'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ColorModeContext } from '../theme/evzoneTheme'
import { getAuthUser, signOut } from '../auth/auth'

const drawerWidth = 220
const drawerWidthMini = 88


type NavItem = { label: string; to: string; icon: React.ReactNode }
type NavSection = { id: string; label: string; items: NavItem[] }

const NAV: NavSection[] = [
  {
    id: 'overview',
    label: 'Overview & Ops',
    items: [
      { label: 'Home', to: '/admin/home', icon: <DashboardIcon /> },
      { label: 'Operations', to: '/admin/ops', icon: <SettingsApplicationsIcon /> },
      { label: 'Reports', to: '/admin/reports', icon: <AssessmentIcon /> },
      { label: 'Global Search', to: '/admin/search', icon: <SearchIcon /> },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      { label: 'Riders', to: '/admin/riders', icon: <PeopleIcon /> },
      { label: 'Drivers', to: '/admin/drivers', icon: <DirectionsCarIcon /> },
      { label: 'Safety overview', to: '/admin/safety', icon: <HealthAndSafetyIcon /> },
      { label: 'Risk & fraud', to: '/admin/risk', icon: <GppBadIcon /> },
      { label: 'Agents', to: '/admin/agents', icon: <SupportAgentIcon /> },
      { label: 'Admin users', to: '/admin/admin-users', icon: <SupervisorAccountIcon /> },
      { label: 'Roles & permissions', to: '/admin/roles', icon: <SecurityIcon /> },
    ],
  },
  {
    id: 'companies',
    label: 'Companies & Finance',
    items: [
      { label: 'Companies', to: '/admin/companies', icon: <BusinessIcon /> },
      { label: 'Financial overview', to: '/admin/finance', icon: <AccountBalanceIcon /> },
      { label: 'Taxes & invoices', to: '/admin/finance/tax-invoices', icon: <ReceiptIcon /> },
    ],
  },
  {
    id: 'product',
    label: 'Product config',
    items: [
      { label: 'Services', to: '/admin/services', icon: <CategoryIcon /> },
      { label: 'Pricing rules', to: '/admin/pricing', icon: <PriceChangeIcon /> },
      { label: 'Promotions', to: '/admin/promos', icon: <LocalOfferIcon /> },
      { label: 'Vertical policies', to: '/admin/vertical-policies', icon: <PolicyIcon /> },
      { label: 'Approvals', to: '/admin/approvals', icon: <FactCheckIcon /> },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { label: 'Training', to: '/admin/training', icon: <SchoolIcon /> },
      { label: 'Feature flags', to: '/admin/system/flags', icon: <FlagIcon /> },
      { label: 'Integrations', to: '/admin/system/integrations', icon: <IntegrationInstructionsIcon /> },
      { label: 'System overview', to: '/admin/system/overview', icon: <DnsIcon /> },
      { label: 'Audit log', to: '/admin/system/audit-log', icon: <HistoryIcon /> },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [{ label: 'My profile', to: '/admin/profile', icon: <AccountCircleIcon /> }],
  },
]

const EV_COLORS = {
  primary: '#03cd8c',
  secondary: '#f77f00',
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase()).join('') || 'AA'
}

export default function AdminShell() {
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { mode, toggle } = React.useContext(ColorModeContext)

  const isMdDown = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)

  const user = getAuthUser() || { name: 'Admin', email: 'admin@evzone.app', role: 'Admin' }
  const userInitials = useMemo(() => initials(user.name), [user.name])

  const handleDrawerToggle = () => setMobileOpen((v) => !v)
  const handleDesktopToggle = () => setDesktopOpen((v) => !v)
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => setUserMenuAnchor(event.currentTarget)
  const handleUserMenuClose = () => setUserMenuAnchor(null)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    if (!q) return
    navigate(`/admin/search?query=${encodeURIComponent(q)}`)
    setSearch('')
  }

  const breadcrumb = location.pathname
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean)
    .slice(1) // remove 'admin'
    .join(' / ')
    .replace(/-/g, ' ')
    .replace(/%20/g, ' ')

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: "hidden" }}>
      {/* Sidebar Logo Area - Hidden on Desktop if collapsed, or shown differently? 
          Actually, user wants Logo in Header. We can keep this for Mobile or Full Desktop, 
          but simpler to just hide/simplify when collapsed. */}
      {/* We only show this big block if open or mobile */}
      {(mobileOpen || desktopOpen) && (
        <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 999,
                bgcolor: EV_COLORS.primary,
                boxShadow: '0 0 0 4px rgba(3,205,140,0.18)',
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '0.15em',
                  lineHeight: 1,
                  mb: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                EVZONE
              </Typography>
              <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.6, lineHeight: 1 }}>
                ADMIN PORTAL
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleDesktopToggle} size="small" sx={{ display: { xs: 'none', md: 'flex' } }}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* When collapsed, show expand button */}
      {(!mobileOpen && !desktopOpen) && (
        <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
          <IconButton onClick={handleDesktopToggle} size="small">
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}

      <Divider sx={{ opacity: 0.6 }} />

      <Box sx={{ flex: 1, overflowY: 'auto', px: (mobileOpen || desktopOpen) ? 2 : 1 }}>
        <List sx={{ pt: 1 }}>
          {NAV.map((section) => (
            <React.Fragment key={section.id}>
              {(mobileOpen || desktopOpen) && section.id !== 'overview' && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    px: 3,
                    mt: 3,
                    mb: 1,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                    opacity: 0.7,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {section.label}
                </Typography>
              )}
              {/* Divider for sections in mini mode */}
              {(!mobileOpen && !desktopOpen) && section.id !== 'overview' && (
                <Divider sx={{ my: 2, opacity: 0.4 }} />
              )}

              {section.items.map((item) => (
                <NavItem
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  minimized={!mobileOpen && !desktopOpen}
                />
              ))}
            </React.Fragment>
          ))}
        </List>
      </Box>

      {(mobileOpen || desktopOpen) && (
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundImage: `linear-gradient(135deg, ${EV_COLORS.primary}20, ${EV_COLORS.secondary}10)`,
              border: '1px solid',
              borderColor: `${EV_COLORS.primary}30`,
            }}
          >
            <Typography variant="caption" display="block" sx={{ fontWeight: 600, mb: 0.5 }}>
              Need help?
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: 11, mb: 1.5 }}>
              Check docs or contact engineering.
            </Typography>
            <Button
              size="small"
              variant="outlined"
              fullWidth
              sx={{
                fontSize: 10,
                height: 28,
                borderColor: 'divider',
                color: 'text.primary',
                bgcolor: 'background.paper',
              }}
            >
              Documentation
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Sidebar */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 0 },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: desktopOpen ? drawerWidth : drawerWidthMini,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          '& .MuiDrawer-paper': {
            width: desktopOpen ? drawerWidth : drawerWidthMini,
            borderRight: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
        open
      >
        {/* We reuse drawerContent but it adapts via shared state closure if we used props, but here it uses the state directly because its defined inside the component */}
        {drawerContent}
      </Drawer>

      {/* Main Layout */}
      <Box sx={{
        flexGrow: 1,
        // Replaced width calc with simple flex behavior since Drawer is now distinct
        // But wait, Drawer variant permanent takes up flow space? Yes.
        // The issue described was "covering". This usually happens if position fixed/absolute.
        // By default Drawer is fixed.
        // To fix overlay, we can just let flex handle it if we structure it right or use margin.
        // But standard admin template usually uses marginLeft/Width.
        // Because the Drawer above has "display: block" in sx for md, it MIGHT be taking space if position is relative? 
        // Actually MUI Drawer is fixed by default. 
        // So we MUST add margin or width adjustment.
        width: {
          xs: '100%',
          md: `calc(100% - ${desktopOpen ? drawerWidth : drawerWidthMini}px)`
        },
        display: 'flex',
        flexDirection: 'column',
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}>
        {/* Top Navbar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.paper', // Match paper for seamless look
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider',
            zIndex: (theme) => theme.zIndex.drawer + 1, // Ensure it stays on top if needed, but sticky is fine
            '@media (min-width: 0px)': { // Override default MUI paper styles if needed
              backgroundColor: mode === 'dark' ? 'rgba(11, 18, 32, 0.85)' : 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
            }
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
            {/* Left Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Mobile Toggle */}
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 1, display: { md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>

              <Typography variant="h6" noWrap component="div" sx={{ fontSize: 16, fontWeight: 600, ml: { md: 2 } }}>
                {breadcrumb ? breadcrumb.split(' / ').pop() : 'Dashboard'}
              </Typography>
            </Box>

            {/* Center: Search Bar */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', px: 2 }}>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, width: '100%', maxWidth: 480 }}>
                <TextField
                  placeholder="Search riders, drivers..."
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Button
                          type="submit"
                          size="small"
                          variant="contained"
                          onClick={handleSearchSubmit}
                          sx={{
                            borderRadius: 2,
                            fontSize: 11,
                            px: 2,
                            minWidth: 'auto',
                            bgcolor: EV_COLORS.primary,
                            '&:hover': { bgcolor: '#0fb589' },
                          }}
                        >
                          Go
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: mode === 'dark' ? '#020617' : '#f3f4f6',
                      pl: 1,
                      '& fieldset': { borderColor: 'transparent' },
                      '&:hover fieldset': { borderColor: EV_COLORS.primary },
                      '&.Mui-focused fieldset': { borderColor: EV_COLORS.primary },
                    },
                    '& input': { fontSize: 13 },
                  }}
                />
              </Box>
            </Box>

            {/* Right Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Theme Toggle */}
              <IconButton onClick={toggle} color="inherit">
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>

              {/* User Menu */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  onClick={handleUserMenuOpen}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: EV_COLORS.primary,
                    color: '#020617',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    '&:hover': { boxShadow: '0 0 0 3px rgba(3,205,140,0.3)' },
                  }}
                >
                  {userInitials}
                </Avatar>
                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={handleUserMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 200,
                      borderRadius: 2,
                      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                  <MenuItem onClick={() => { handleUserMenuClose(); navigate('/admin/profile') }} sx={{ py: 1.5 }}>
                    <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Profile" primaryTypographyProps={{ fontSize: 13 }} />
                  </MenuItem>
                  <MenuItem onClick={() => { handleUserMenuClose(); navigate('/admin/settings') }} sx={{ py: 1.5 }}>
                    <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: 13 }} />
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleUserMenuClose()
                      signOut()
                      navigate('/admin/login')
                    }}
                    sx={{ py: 1.5, color: 'error.main' }}
                  >
                    <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: 13 }} />
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1 }}>
            <Outlet />
          </Box>

          {/* Footer */}
          <Box component="footer" sx={{ mt: 4, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              © 2024 EV-ZONE. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              {['Privacy Policy', 'Terms of Service', 'Help Center'].map((text) => (
                <Typography
                  key={text}
                  variant="caption"
                  color="text.secondary"
                  sx={{ cursor: 'pointer', '&:hover': { color: EV_COLORS.primary } }}
                >
                  {text}
                </Typography>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

function NavItem({ to, label, icon, minimized }: { to: string; label: string; icon: React.ReactNode; minimized: boolean }) {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <ListItemButton
      component={NavLink}
      to={to}
      sx={{
        position: 'relative',
        borderRadius: 2,
        mx: 1.5,
        mb: 0.5,
        minHeight: 40,
        px: minimized ? 1 : 2,
        justifyContent: minimized ? 'center' : 'initial',
        color: isActive ? 'text.primary' : 'text.secondary',
        backgroundColor: isActive ? EV_COLORS.primary + '33' : 'transparent',
        '&::before': isActive
          ? {
            content: '""',
            position: 'absolute',
            left: minimized ? '50%' : 4,
            top: minimized ? 'auto' : 8,
            bottom: minimized ? 4 : 8,
            height: minimized ? 4 : 'auto',
            width: minimized ? 4 : 4,
            transform: minimized ? 'translateX(-50%)' : 'none',
            borderRadius: 4,
            background: `linear-gradient(180deg, ${EV_COLORS.primary}, ${EV_COLORS.secondary})`,
          }
          : {},
        '&:hover': {
          backgroundColor: isActive ? EV_COLORS.primary + '40' : 'rgba(148,163,184,0.18)',
        },
      }}
    >
      <ListItemIcon sx={{
        minWidth: 0,
        mr: minimized ? 0 : 2,
        justifyContent: 'center',
        color: isActive ? EV_COLORS.primary : 'inherit'
      }}>
        {/* Clone element to force size if needed, but default is usually fine. */}
        {React.cloneElement(icon as React.ReactElement, { fontSize: 'small' })}
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{ fontSize: 13, fontWeight: isActive ? 700 : 500 }}
        sx={{ opacity: minimized ? 0 : 1, display: minimized ? 'none' : 'block' }}
      />
    </ListItemButton>
  )
}
