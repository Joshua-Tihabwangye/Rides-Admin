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
  Breadcrumbs,
  Link as MuiLink,
  Badge,
  Popover,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import PaymentsIcon from '@mui/icons-material/Payments'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import SyncAltIcon from '@mui/icons-material/SyncAlt'
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
import RotateLeftIcon from '@mui/icons-material/RotateLeft'
import ReplayIcon from '@mui/icons-material/Replay'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import NotificationsIcon from '@mui/icons-material/Notifications'
import WarningIcon from '@mui/icons-material/Warning'
import InfoIcon from '@mui/icons-material/Info'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import LabelIcon from '@mui/icons-material/Label'
import PrintIcon from '@mui/icons-material/Print'
import InventoryIcon from '@mui/icons-material/Inventory'
import StorefrontIcon from '@mui/icons-material/Storefront'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ColorModeContext } from '../theme/evzoneTheme'
import { AdminLiveDataProvider } from '../components/AdminLiveDataProvider'
import { getAuthUser, isAuthed, signOut } from '../auth/auth'
import { getUserPermissions, type AdminPermission } from '../auth/permissions'
import {
  ADMIN_SUMMARY_UPDATED_EVENT,
  createAdminSocket,
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  type AdminNotificationResponse,
} from '../services/api/adminApi'
import SafetyIncidentPopup from '../components/SafetyIncidentPopup'
import AdminIncomingCallOverlay from '../components/AdminIncomingCallOverlay'

const drawerWidth = 220
const drawerWidthMini = 88
const ADMIN_ROUTE_PRELOAD_EVENT = 'evzone:admin-preload-route-chunks'


type NavItem = { label: string; to: string; icon: React.ReactNode; anyOf?: AdminPermission[] }
type NavSection = { id: string; label: string; items: NavItem[] }

const NAV: NavSection[] = [
  {
    id: 'overview',
    label: 'Overview & Ops',
    items: [
      { label: 'Home', to: '/admin/home', icon: <DashboardIcon />, anyOf: ['view_dashboard'] },
      { label: 'Operations', to: '/admin/ops', icon: <SettingsApplicationsIcon />, anyOf: ['manage_operations'] },
      { label: 'Live drivers map', to: '/admin/live-map', icon: <MapIcon />, anyOf: ['manage_operations'] },
      { label: 'Monitoring', to: '/admin/monitoring', icon: <AssessmentIcon />, anyOf: ['manage_operations'] },
      { label: 'Matching', to: '/admin/matching', icon: <AssessmentIcon />, anyOf: ['manage_operations'] },
      { label: 'Reports', to: '/admin/reports', icon: <AssessmentIcon />, anyOf: ['manage_operations'] },
      { label: 'Global Search', to: '/admin/search', icon: <SearchIcon /> },
    ],
  },
  {
    id: 'rides',
    label: 'Rides',
    items: [
      { label: 'All rides', to: '/admin/rides', icon: <DirectionsCarIcon />, anyOf: ['view_rides'] },
      { label: 'Ride anomalies', to: '/admin/rides/anomalies', icon: <WarningIcon />, anyOf: ['view_rides'] },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      { label: 'Riders', to: '/admin/riders', icon: <PeopleIcon />, anyOf: ['manage_people'] },
      { label: 'Drivers', to: '/admin/drivers', icon: <DirectionsCarIcon />, anyOf: ['manage_people'] },
      { label: 'Safety overview', to: '/admin/safety', icon: <HealthAndSafetyIcon />, anyOf: ['manage_people'] },
      { label: 'Risk & fraud', to: '/admin/risk', icon: <GppBadIcon />, anyOf: ['manage_people'] },
      { label: 'Agents', to: '/admin/agents', icon: <SupportAgentIcon />, anyOf: ['manage_people'] },
      { label: 'Admin users', to: '/admin/admin-users', icon: <SupervisorAccountIcon />, anyOf: ['view_admin_users', 'manage_admin_users'] },
      { label: 'Roles & permissions', to: '/admin/roles', icon: <SecurityIcon />, anyOf: ['view_roles', 'manage_roles'] },
    ],
  },
  {
    id: 'companies',
    label: 'Companies & Finance',
    items: [
      { label: 'Companies', to: '/admin/companies', icon: <BusinessIcon />, anyOf: ['manage_companies'] },
      { label: 'Financial overview', to: '/admin/finance', icon: <AccountBalanceIcon />, anyOf: ['manage_finance'] },
      { label: 'Cashouts', to: '/admin/finance/cashouts', icon: <AccountBalanceWalletIcon />, anyOf: ['manage_finance'] },
      { label: 'Payouts', to: '/admin/finance/payouts', icon: <PaymentsIcon />, anyOf: ['manage_finance'] },
      { label: 'Payments', to: '/admin/finance/payments', icon: <CreditCardIcon />, anyOf: ['manage_finance'] },
      { label: 'Settlements', to: '/admin/finance/settlements', icon: <ReceiptLongIcon />, anyOf: ['manage_finance'] },
      { label: 'Wallet reconciliation', to: '/admin/finance/wallet-reconciliation', icon: <AccountBalanceWalletIcon />, anyOf: ['manage_finance'] },
      { label: 'Reconciliation runs', to: '/admin/finance/reconciliation-runs', icon: <SyncAltIcon />, anyOf: ['manage_finance'] },
      { label: 'Taxes & invoices', to: '/admin/finance/tax-invoices', icon: <ReceiptIcon />, anyOf: ['manage_finance'] },
    ],
  },
  {
    id: 'logistics',
    label: 'Logistics',
    items: [
      { label: 'Deliveries', to: '/admin/deliveries', icon: <LocalShippingIcon />, anyOf: ['view_deliveries'] },
      { label: 'Return shipments', to: '/admin/returns', icon: <RotateLeftIcon />, anyOf: ['view_deliveries'] },
      { label: 'Return requests', to: '/admin/returns/requests', icon: <ReplayIcon />, anyOf: ['view_deliveries', 'manage_deliveries'] },
      { label: 'Return reconciliation', to: '/admin/returns/reconciliation', icon: <SyncAltIcon />, anyOf: ['view_deliveries', 'manage_deliveries'] },
      { label: 'Package Labels', to: '/admin/delivery-labels', icon: <LabelIcon />, anyOf: ['view_delivery_labels'] },
      { label: 'Print Queue', to: '/admin/delivery-labels/print-queue', icon: <PrintIcon />, anyOf: ['print_delivery_labels'] },
      { label: 'Label Exceptions', to: '/admin/delivery-labels/exceptions', icon: <WarningIcon />, anyOf: ['view_delivery_labels'] },
      { label: 'Blank Label Stock', to: '/admin/delivery-label-stock', icon: <InventoryIcon />, anyOf: ['activate_blank_labels'] },
    ],
  },
  {
    id: 'marketplace',
    label: 'Marketplace Simulation',
    items: [
      { label: 'Client Shop', to: '/admin/marketplace/client/products', icon: <StorefrontIcon />, anyOf: ['view_deliveries'] },
      { label: 'Client Cart', to: '/admin/marketplace/client/cart', icon: <ShoppingCartIcon />, anyOf: ['view_deliveries'] },
      { label: 'Seller Orders', to: '/admin/marketplace/seller/orders', icon: <InventoryIcon />, anyOf: ['view_deliveries'] },
    ],
  },
  {
    id: 'product',
    label: 'Product config',
    items: [
      { label: 'Services', to: '/admin/services', icon: <CategoryIcon />, anyOf: ['manage_pricing'] },
      { label: 'Pricing management', to: '/admin/pricing', icon: <PriceChangeIcon />, anyOf: ['manage_pricing'] },
      { label: 'Promotions', to: '/admin/promos', icon: <LocalOfferIcon />, anyOf: ['manage_promotions'] },
      { label: 'Vertical policies', to: '/admin/vertical-policies', icon: <PolicyIcon />, anyOf: ['manage_pricing'] },
      { label: 'Approvals', to: '/admin/approvals', icon: <FactCheckIcon />, anyOf: ['manage_operations'] },
      { label: 'Document Review', to: '/admin/documents/review', icon: <FactCheckIcon />, anyOf: ['manage_operations'] },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { label: 'Training', to: '/admin/training', icon: <SchoolIcon />, anyOf: ['manage_system'] },
      { label: 'Feature flags', to: '/admin/system/flags', icon: <FlagIcon />, anyOf: ['manage_system'] },
      { label: 'Integrations', to: '/admin/system/integrations', icon: <IntegrationInstructionsIcon />, anyOf: ['manage_system'] },
      { label: 'System overview', to: '/admin/system/overview', icon: <DnsIcon />, anyOf: ['manage_system'] },
      { label: 'Audit log', to: '/admin/system/audit-log', icon: <HistoryIcon />, anyOf: ['manage_system'] },
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

type NotificationItem = {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  title: string
  message: string
  time: string
  read: boolean
  path: string
}

function notificationType(rawType?: string): NotificationItem['type'] {
  const type = rawType?.toUpperCase()
  if (type === 'SAFETY' || type === 'CALL') return 'error'
  if (type === 'PAYMENT' || type === 'DELIVERY' || type === 'DOCUMENT') return 'warning'
  if (type === 'SYSTEM') return 'info'
  return 'info'
}

function notificationPath(notification: AdminNotificationResponse): string {
  const data = notification.data ?? {}
  const path = typeof data.path === 'string' ? data.path : undefined
  if (path?.startsWith('/admin/')) return path
  const type = notification.type?.toUpperCase()
  if (type === 'SAFETY' || type === 'CALL') return '/admin/safety'
  if (type === 'PAYMENT') return '/admin/finance/payments'
  if (type === 'DELIVERY') return '/admin/deliveries'
  if (type === 'DOCUMENT') return '/admin/documents/review'
  return '/admin/home'
}

function relativeTime(value?: string): string {
  if (!value) return ''
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return ''
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function mapNotification(notification: AdminNotificationResponse): NotificationItem {
  return {
    id: notification.id,
    type: notificationType(notification.type),
    title: notification.title,
    message: notification.body,
    time: relativeTime(notification.createdAt),
    read: Boolean(notification.readAt),
    path: notificationPath(notification),
  }
}

function notificationItems(response: unknown): AdminNotificationResponse[] {
  if (response && typeof response === 'object') {
    const maybeItems = (response as { items?: unknown }).items
    if (Array.isArray(maybeItems)) return maybeItems as AdminNotificationResponse[]

    const maybeData = (response as { data?: unknown }).data
    if (maybeData && typeof maybeData === 'object') {
      const envelopedItems = (maybeData as { items?: unknown }).items
      if (Array.isArray(envelopedItems)) return envelopedItems as AdminNotificationResponse[]
    }
  }

  return []
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
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const user = getAuthUser()
  const userInitials = useMemo(() => (user ? initials(user.name) : ''), [user?.name])
  const visibleNav = useMemo(() => {
    if (!user) return []
    const granted = new Set(getUserPermissions(user))
    return NAV.map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.anyOf?.length || item.anyOf.some((permission) => granted.has(permission))),
    })).filter((section) => section.items.length > 0)
  }, [user?.activeRole, user?.email, user?.permissions?.join('|'), user?.roles?.join('|')])

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (!isAuthed() || !user) return undefined

    let cancelled = false
    const refreshNotifications = async () => {
      try {
        const response = await listAdminNotifications({ page: 1, limit: 30 })
        if (cancelled) return
        setNotifications(notificationItems(response).map(mapNotification))
      } catch (error) {
        console.warn('Failed to load admin notifications.', error)
      }
    }

    void refreshNotifications()
    const handleSummaryUpdate = () => {
      void refreshNotifications()
    }

    window.addEventListener(ADMIN_SUMMARY_UPDATED_EVENT, handleSummaryUpdate as EventListener)
    return () => {
      cancelled = true
      window.removeEventListener(ADMIN_SUMMARY_UPDATED_EVENT, handleSummaryUpdate as EventListener)
    }
  }, [location.pathname])

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (!isAuthed() || !user) return undefined

    const socket = createAdminSocket()
    const upsertNotification = (payload: AdminNotificationResponse) => {
      setNotifications((prev) => {
        const next = [mapNotification(payload), ...prev.filter((item) => item.id !== payload.id)]
        return next.slice(0, 30)
      })
    }

    socket.on('notification.created', upsertNotification)
    socket.connect()

    return () => {
      socket.off('notification.created', upsertNotification)
      socket.disconnect()
    }
  }, [user?.email])

  if (!isAuthed() || !user) {
    navigate('/admin/login', { replace: true })
    return null
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const handleDrawerToggle = () => setMobileOpen((v) => !v)
  const handleDesktopToggle = () => setDesktopOpen((v) => !v)
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => setUserMenuAnchor(event.currentTarget)
  const handleUserMenuClose = () => setUserMenuAnchor(null)
  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => setNotificationAnchor(event.currentTarget)
  const handleNotificationClose = () => setNotificationAnchor(null)

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    void markAdminNotificationRead(id).catch((error) => {
      console.warn('Failed to mark notification as read.', error)
    })
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    void markAllAdminNotificationsRead().catch((error) => {
      console.warn('Failed to mark all notifications as read.', error)
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <WarningIcon sx={{ color: '#f77f00' }} fontSize="small" />
      case 'error': return <WarningIcon sx={{ color: '#ef4444' }} fontSize="small" />
      case 'success': return <CheckCircleIcon sx={{ color: '#03cd8c' }} fontSize="small" />
      default: return <InfoIcon sx={{ color: '#3b82f6' }} fontSize="small" />
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    if (!q) return
    navigate(`/admin/search?query=${encodeURIComponent(q)}`)
    setSearch('')
  }

  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .slice(1); // remove 'admin'

  const breadcrumbElements = breadcrumbs.map((value, index) => {
    const to = `/admin/${breadcrumbs.slice(0, index + 1).join('/')}`;
    const isLast = index === breadcrumbs.length - 1;
    const label = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

    return isLast ? (
      <Typography key={to} color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>
        {label}
      </Typography>
    ) : (
      <MuiLink
        component={NavLink}
        key={to}
        to={to}
        underline="hover"
        color="inherit"
        sx={{ fontSize: 13 }}
      >
        {label}
      </MuiLink>
    );
  });

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow:"hidden" }}>
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
          {visibleNav.map((section) => (
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
                <NavItemComponent
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
        // The issue described was"covering". This usually happens if position fixed/absolute.
        // By default Drawer is fixed.
        // To fix overlay, we can just let flex handle it if we structure it right or use margin.
        // But standard admin template usually uses marginLeft/Width.
        // Because the Drawer above has"display: block" in sx for md, it MIGHT be taking space if position is relative? 
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
                Dashboard
              </Typography>

              <Box sx={{ display: { xs: 'none', md: 'flex' }, ml: 2 }}>
                <Breadcrumbs
                  separator={<NavigateNextIcon fontSize="small" />}
                  aria-label="breadcrumb"
                >
                  <MuiLink component={NavLink} to="/admin/home" underline="hover" color="inherit" sx={{ fontSize: 13 }}>
                    Home
                  </MuiLink>
                  {breadcrumbElements}
                </Breadcrumbs>
              </Box>
            </Box>

            {/* Center: Search Bar */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', px: 2, alignItems: 'center', gap: 1 }}>
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
              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate('/admin/search')}
                sx={{
                  fontSize: 10,
                  textTransform: 'none',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  display: { xs: 'none', md: 'flex' },
                }}
              >
                Quick filters
              </Button>
            </Box>

            {/* Right Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Notifications */}
              <IconButton onClick={handleNotificationOpen} color="inherit">
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              {/* Notifications Popover */}
              <Popover
                open={Boolean(notificationAnchor)}
                anchorEl={notificationAnchor}
                onClose={handleNotificationClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    width: 360,
                    maxHeight: 480,
                    borderRadius: 2,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Notifications
                  </Typography>
                  {unreadCount > 0 && (
                    <Button size="small" onClick={handleMarkAllAsRead} sx={{ fontSize: 11, textTransform: 'none' }}>
                      Mark all as read
                    </Button>
                  )}
                </Box>
                <Box sx={{ maxHeight: 380, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No notifications
                      </Typography>
                    </Box>
                  ) : (
                    notifications.map((notification) => (
                      <Box
                        key={notification.id}
                      onClick={() => {
                        handleMarkAsRead(notification.id)
                        navigate(notification.path)
                        handleNotificationClose()
                      }}
                        sx={{
                          p: 2,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          cursor: 'pointer',
                          bgcolor: notification.read ? 'transparent' : 'action.hover',
                          '&:hover': { bgcolor: 'action.selected' },
                          display: 'flex',
                          gap: 2,
                        }}
                      >
                        <Box sx={{ mt: 0.5 }}>
                          {getNotificationIcon(notification.type)}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: notification.read ? 400 : 600, fontSize: 13 }}>
                            {notification.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
                            {notification.time}
                          </Typography>
                        </Box>
                        {!notification.read && (
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: EV_COLORS.primary, mt: 1 }} />
                        )}
                      </Box>
                    ))
                  )}
                </Box>
              </Popover>

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
            <AdminLiveDataProvider>
              <Outlet />
            </AdminLiveDataProvider>
          </Box>


        </Box>
      </Box>

      {/* Global red-alert popup for live SOS / safety incidents — visible on
          every admin page; clicking navigates to the driver in trouble. */}
      <SafetyIncidentPopup />
      <AdminIncomingCallOverlay />
    </Box>
  )
}

function NavItemComponent({ to, label, icon, minimized }: { to: string; label: string; icon: React.ReactNode; minimized: boolean }) {
  const location = useLocation()
  const requestRoutePreload = React.useCallback(() => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new Event(ADMIN_ROUTE_PRELOAD_EVENT))
  }, [])
  
  // More precise active matching - only exact match or direct children
  // Avoid highlighting parent routes when on child routes
  const isExactMatch = location.pathname === to
  const isChildRoute = location.pathname.startsWith(to + '/') && 
    // Make sure this isn't a more specific route that should take precedence
    !NAV.flatMap(s => s.items).some(item => 
      item.to !== to && 
      item.to.startsWith(to + '/') && 
      (location.pathname === item.to || location.pathname.startsWith(item.to + '/'))
    )
  const isActive = isExactMatch || isChildRoute

  return (
    <ListItemButton
      component={NavLink}
      to={to}
      onMouseEnter={requestRoutePreload}
      onFocus={requestRoutePreload}
      onTouchStart={requestRoutePreload}
      sx={{
        position: 'relative',
        borderRadius: 2,
        mb: 0.5,
        width: '100%',
        boxSizing: 'border-box',
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
