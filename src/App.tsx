import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './auth/RequireAuth'
import RequirePermission from './auth/RequirePermission'
import AdminShell from './layout/AdminShell'
import AdminBackendBootstrap from './components/AdminBackendBootstrap'

const routePreloaders: Array<() => Promise<unknown>> = []
const ADMIN_ROUTE_PRELOAD_EVENT = 'evzone:admin-preload-route-chunks'
const ADMIN_ASSET_RELOAD_KEY = 'evzone-admin-asset-reload'
let preloadStarted = false


function reloadOnceForStaleAsset() {
  if (typeof window === 'undefined') return
  if (window.sessionStorage.getItem(ADMIN_ASSET_RELOAD_KEY)) return
  window.sessionStorage.setItem(ADMIN_ASSET_RELOAD_KEY, '1')
  window.location.reload()
}

function isAdminBuildAsset(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target instanceof HTMLScriptElement) return target.src.includes('/assets/')
  if (target instanceof HTMLLinkElement) {
    return target.href.includes('/assets/') && (target.rel === 'stylesheet' || target.rel === 'modulepreload')
  }
  return false
}

function useStaleAssetRecovery() {
  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const releaseReloadGuard = window.setTimeout(() => {
      window.sessionStorage.removeItem(ADMIN_ASSET_RELOAD_KEY)
    }, 5000)
    const handlePreloadError = (event: Event) => {
      event.preventDefault()
      reloadOnceForStaleAsset()
    }
    const handleResourceError = (event: Event) => {
      if (isAdminBuildAsset(event.target)) reloadOnceForStaleAsset()
    }
    window.addEventListener('vite:preloadError', handlePreloadError as EventListener)
    window.addEventListener('error', handleResourceError, true)
    return () => {
      window.clearTimeout(releaseReloadGuard)
      window.removeEventListener('vite:preloadError', handlePreloadError as EventListener)
      window.removeEventListener('error', handleResourceError, true)
    }
  }, [])
}

function preloadAdminRouteChunks(cancelled: () => boolean = () => false) {
  if (preloadStarted) return Promise.resolve()
  preloadStarted = true
  const pending = [...routePreloaders]
  const workers = Array.from({ length: 4 }, async () => {
    while (!cancelled() && pending.length) {
      const preload = pending.shift()
      if (!preload) return
      try {
        await preload()
      } catch {
        // recoverableLazy handles stale chunks when a route is actually opened.
      }
    }
  })
  return Promise.all(workers).then(() => undefined)
}

function RouteLoading() {
  return (
    <div style={{ minHeight: 280, display: 'grid', placeItems: 'center', color: '#475569', fontSize: 13 }}>
      Loading...
    </div>
  )
}

function recoverableLazy<T extends React.ComponentType<any>>(loader: () => Promise<{ default: T }>) {
  const load = () =>
    loader().then((module) => {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('evzone-admin-chunk-reload')
      }
      return module
    }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      const chunkFailed =
        /Failed to fetch dynamically imported module|ChunkLoadError|Loading chunk \d+ failed|Importing a module script failed/i.test(message)
      if (
        chunkFailed &&
        typeof window !== 'undefined' &&
        !window.sessionStorage.getItem('evzone-admin-chunk-reload')
      ) {
        window.sessionStorage.setItem('evzone-admin-chunk-reload', '1')
        window.location.reload()
        return new Promise<{ default: T }>(() => {})
      }
      throw error
    })
  routePreloaders.push(load)
  return lazy(load)
}

function useIdleRoutePreload() {
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false
    const run = () => void preloadAdminRouteChunks(() => cancelled)
    const handlePreloadRequest = () => run()
    window.addEventListener(ADMIN_ROUTE_PRELOAD_EVENT, handlePreloadRequest)
    const requestIdle = (window as any).requestIdleCallback as undefined | ((callback: () => void) => number)
    const cancelIdle = (window as any).cancelIdleCallback as undefined | ((id: number) => void)
    const id = requestIdle ? requestIdle(run) : window.setTimeout(run, 1500)
    return () => {
      cancelled = true
      window.removeEventListener(ADMIN_ROUTE_PRELOAD_EVENT, handlePreloadRequest)
      if (requestIdle && cancelIdle) cancelIdle(id)
      else window.clearTimeout(id)
    }
  }, [])
}

const AdminAuthSignIn = recoverableLazy(() => import('./pages/AdminAuthSignIn'))
const AdminAuthSignUp = recoverableLazy(() => import('./pages/AdminAuthSignUp'))
const ForgotPassword = recoverableLazy(() => import('./pages/ForgotPassword'))
const VerifyResetOtp = recoverableLazy(() => import('./pages/VerifyResetOtp'))
const ResetPassword = recoverableLazy(() => import('./pages/ResetPassword'))
const AdminWelcomeNotice = recoverableLazy(() => import('./pages/AdminWelcomeNotice'))
const AdminOnboardingChecklist = recoverableLazy(() => import('./pages/AdminOnboardingChecklist'))
const AdminHomeDashboard = recoverableLazy(() => import('./pages/AdminHomeDashboard'))
const AdminProfileRegions = recoverableLazy(() => import('./pages/AdminProfileRegions'))
const AdminGlobalSearch = recoverableLazy(() => import('./pages/AdminGlobalSearch'))
const RiderManagement = recoverableLazy(() => import('./pages/RiderManagement'))
const RiderDetail = recoverableLazy(() => import('./pages/RiderDetail'))
const RiderCreate = recoverableLazy(() => import('./pages/RiderCreate'))
const DriverManagement = recoverableLazy(() => import('./pages/DriverManagement'))
const DriverDetail = recoverableLazy(() => import('./pages/DriverDetail'))
const DriverCreate = recoverableLazy(() => import('./pages/DriverCreate'))
const SafetyOverview = recoverableLazy(() => import('./pages/SafetyOverview'))
const SosIncidentDetailPage = recoverableLazy(() => import('./pages/SosIncidentDetailPage'))
const RiskFraudCenter = recoverableLazy(() => import('./pages/RiskFraudCenter'))
const RiskDetail = recoverableLazy(() => import('./pages/RiskDetail'))
const CompanyList = recoverableLazy(() => import('./pages/CompanyList'))
const CompanyDetail = recoverableLazy(() => import('./pages/CompanyDetail'))
const FinancialOverview = recoverableLazy(() => import('./pages/FinancialOverview'))
const CompanyPayouts = recoverableLazy(() => import('./pages/CompanyPayouts'))
const FinanceCashouts = recoverableLazy(() => import('./pages/FinanceCashouts'))
const FinancePayouts = recoverableLazy(() => import('./pages/FinancePayouts'))
const FinancePayments = recoverableLazy(() => import('./pages/FinancePayments'))
const FinanceSettlements = recoverableLazy(() => import('./pages/FinanceSettlements'))
const FinanceWalletReconciliation = recoverableLazy(() => import('./pages/FinanceWalletReconciliation'))
const FinanceReconciliationRuns = recoverableLazy(() => import('./pages/FinanceReconciliationRuns'))
const CompanyApprovals = recoverableLazy(() => import('./pages/CompanyApprovals'))
const RegionTaxConfigEditor = recoverableLazy(() => import('./pages/RegionTaxConfigEditor'))
const InvoiceTemplatePreview = recoverableLazy(() => import('./pages/InvoiceTemplatePreview'))
const OperationsDashboard = recoverableLazy(() => import('./pages/OperationsDashboard'))
const MonitoringPage = recoverableLazy(() => import('./pages/MonitoringPage'))
const LiveDriversMapPage = recoverableLazy(() => import('./pages/LiveDriversMapPage'))
const MatchingInspectionPage = recoverableLazy(() => import('./pages/MatchingInspectionPage'))
const DetailedAnalytics = recoverableLazy(() => import('./pages/DetailedAnalytics'))
const ApprovalsDashboard = recoverableLazy(() => import('./pages/ApprovalsDashboard'))
const ApprovalDetail = recoverableLazy(() => import('./pages/ApprovalDetail'))
const DocumentReviewPage = recoverableLazy(() => import('./pages/DocumentReviewPage'))
const ServiceConfiguration = recoverableLazy(() => import('./pages/ServiceConfiguration'))
const PricingManagement = recoverableLazy(() => import('./pages/PricingManagement'))
const PricingRulesOverview = recoverableLazy(() => import('./pages/PricingRulesTariffs'))
const ZoneCreate = recoverableLazy(() => import('./pages/ZoneCreate'))
const ZonesGeofences = recoverableLazy(() => import('./pages/ZonesGeofences'))
const ZoneMapView = recoverableLazy(() => import('./pages/ZoneMapView'))
const ZonePricingDetail = recoverableLazy(() => import('./pages/ZonePricingDetail'))
const ZonesList = recoverableLazy(() => import('./pages/ZonesList'))
const PromotionsIncentives = recoverableLazy(() => import('./pages/PromotionsIncentives'))
const PromoDetail = recoverableLazy(() => import('./pages/PromoDetail'))
const VerticalPolicies = recoverableLazy(() => import('./pages/VerticalPolicies'))
const AgentManagement = recoverableLazy(() => import('./pages/AgentManagement'))
const AgentDetail = recoverableLazy(() => import('./pages/AgentDetail'))
const AdminUsersManagement = recoverableLazy(() => import('./pages/AdminUsersManagement'))
const AdminUserDetail = recoverableLazy(() => import('./pages/AdminUserDetail'))
const RolesPermissions = recoverableLazy(() => import('./pages/RolesPermissions'))
const GlobalTrainingManager = recoverableLazy(() => import('./pages/GlobalTrainingManager'))
const TrainingModulePreview = recoverableLazy(() => import('./pages/TrainingModulePreview'))
const LocalizationLanguageContent = recoverableLazy(() => import('./pages/LocalizationLanguageContent'))
const PolicyRuleManagement = recoverableLazy(() => import('./pages/PolicyRuleManagement'))
const FeatureFlagsExperiments = recoverableLazy(() => import('./pages/FeatureFlagsExperiments'))
const ExperimentResults = recoverableLazy(() => import('./pages/ExperimentResults'))
const ApprovalsHistory = recoverableLazy(() => import('./pages/ApprovalsHistory'))
const Integrations = recoverableLazy(() => import('./pages/Integrations'))
const AuditLog = recoverableLazy(() => import('./pages/AuditLog'))
const SystemOverview = recoverableLazy(() => import('./pages/SystemOverview'))
const Settings = recoverableLazy(() => import('./pages/Settings'))
const AccessDenied = recoverableLazy(() => import('./pages/AccessDenied'))
const DeliveryListPage = recoverableLazy(() => import('./pages/DeliveryListPage'))
const DeliveryDetailPage = recoverableLazy(() => import('./pages/DeliveryDetailPage'))
const RidesListPage = recoverableLazy(() => import('./pages/RidesListPage'))
const RideDetailPage = recoverableLazy(() => import('./pages/RideDetailPage'))
const RideAnomaliesPage = recoverableLazy(() => import('./pages/RideAnomaliesPage'))
const ReturnRequestsPage = recoverableLazy(() => import('./pages/ReturnRequestsPage'))
const DisputesPage = recoverableLazy(() => import('./pages/DisputesPage'))
const ReturnShipmentsPage = recoverableLazy(() => import('./pages/ReturnShipmentsPage'))
const ReturnShipmentDetailPage = recoverableLazy(() => import('./pages/ReturnShipmentDetailPage'))
const ReturnReconciliationPage = recoverableLazy(() => import('./pages/ReturnReconciliationPage'))
const PackageLabelPage = recoverableLazy(() => import('./pages/PackageLabelPage'))
const DeliveryLabelsPage = recoverableLazy(() => import('./pages/DeliveryLabelsPage'))
const PrintQueuePage = recoverableLazy(() => import('./pages/PrintQueuePage'))
const LabelExceptionsPage = recoverableLazy(() => import('./pages/LabelExceptionsPage'))
const BlankLabelStockPage = recoverableLazy(() => import('./pages/BlankLabelStockPage'))
const MarketplaceClientProductsPage = recoverableLazy(() => import('./pages/marketplace/MarketplaceClientProductsPage'))
const MarketplaceClientCartPage = recoverableLazy(() => import('./pages/marketplace/MarketplaceClientCartPage'))
const MarketplaceSellerOrdersPage = recoverableLazy(() => import('./pages/marketplace/MarketplaceSellerOrdersPage'))
const MarketplaceSellerOrderDetailPage = recoverableLazy(() => import('./pages/marketplace/MarketplaceSellerOrderDetailPage'))

export default function App() {
  useStaleAssetRecovery()
  useIdleRoutePreload()
  return (
    <BrowserRouter>
      <AdminBackendBootstrap />
      <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* Auth & onboarding (public) */}
        <Route path="/admin/login" element={<AdminAuthSignIn />} />
        <Route path="/admin/signup" element={<AdminAuthSignUp />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/verify-otp" element={<VerifyResetOtp />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />
        <Route path="/admin/onboarding/welcome" element={<AdminWelcomeNotice />} />
        <Route path="/admin/onboarding/checklist" element={<AdminOnboardingChecklist />} />
        <Route path="/admin/access-denied" element={<AccessDenied />} />

        {/* Protected admin area */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminShell />
            </RequireAuth>
          }
        >
          <Route
            path="home"
            element={
              <RequirePermission anyOf={["view_dashboard"]}>
                <AdminHomeDashboard />
              </RequirePermission>
            }
          />
          <Route path="profile" element={<AdminProfileRegions />} />
          <Route path="search" element={<AdminGlobalSearch />} />

          {/* Ops & analytics */}
          <Route
            path="ops"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <OperationsDashboard />
              </RequirePermission>
            }
          />
          <Route
            path="monitoring"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <MonitoringPage />
              </RequirePermission>
            }
          />
          <Route
            path="live-map"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <LiveDriversMapPage />
              </RequirePermission>
            }
          />
          <Route
            path="matching"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <MatchingInspectionPage />
              </RequirePermission>
            }
          />
          <Route
            path="reports"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <DetailedAnalytics />
              </RequirePermission>
            }
          />

          {/* People */}
          <Route
            path="riders"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <RiderManagement />
              </RequirePermission>
            }
          />
          <Route
            path="riders/new"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <RiderCreate />
              </RequirePermission>
            }
          />
          <Route
            path="riders/:id"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <RiderDetail />
              </RequirePermission>
            }
          />
          <Route
            path="drivers"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <DriverManagement />
              </RequirePermission>
            }
          />
          <Route
            path="drivers/new"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <DriverCreate />
              </RequirePermission>
            }
          />
          <Route
            path="drivers/:id"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <DriverDetail />
              </RequirePermission>
            }
          />
          <Route
            path="safety"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <SafetyOverview />
              </RequirePermission>
            }
          />
          <Route
            path="safety/:incidentId"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <SosIncidentDetailPage />
              </RequirePermission>
            }
          />
          <Route
            path="risk"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <RiskFraudCenter />
              </RequirePermission>
            }
          />
          <Route
            path="risk/:riskId"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <RiskDetail />
              </RequirePermission>
            }
          />

          {/* Companies */}
          <Route
            path="companies"
            element={
              <RequirePermission anyOf={["manage_companies"]}>
                <CompanyList />
              </RequirePermission>
            }
          />
          <Route
            path="companies/approvals"
            element={
              <RequirePermission anyOf={["manage_companies"]}>
                <CompanyApprovals />
              </RequirePermission>
            }
          />
          <Route
            path="companies/:companyId"
            element={
              <RequirePermission anyOf={["manage_companies"]}>
                <CompanyDetail />
              </RequirePermission>
            }
          />

          {/* Finance */}
          <Route
            path="finance"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <FinancialOverview />
              </RequirePermission>
            }
          />
          {/* Requested routes for I2 */}
          <Route
            path="finance/companies"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <CompanyList />
              </RequirePermission>
            }
          />
          <Route
            path="finance/companies/:companyId"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <CompanyPayouts />
              </RequirePermission>
            }
          />
          <Route
            path="finance/cashouts"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <FinanceCashouts />
              </RequirePermission>
            }
          />
          <Route
            path="finance/payouts"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <FinancePayouts />
              </RequirePermission>
            }
          />
          <Route
            path="finance/payments"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <FinancePayments />
              </RequirePermission>
            }
          />
          <Route
            path="finance/settlements"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <FinanceSettlements />
              </RequirePermission>
            }
          />
          <Route
            path="finance/wallet-reconciliation"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <FinanceWalletReconciliation />
              </RequirePermission>
            }
          />
          <Route
            path="finance/reconciliation-runs"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <FinanceReconciliationRuns />
              </RequirePermission>
            }
          />
          <Route
            path="finance/tax-invoices"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <RegionTaxConfigEditor />
              </RequirePermission>
            }
          />
          <Route
            path="finance/tax-invoices/:regionId/edit"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <RegionTaxConfigEditor />
              </RequirePermission>
            }
          />
          <Route
            path="finance/tax-invoices/template-preview"
            element={
              <RequirePermission anyOf={["manage_finance"]}>
                <InvoiceTemplatePreview />
              </RequirePermission>
            }
          />

          {/* Marketplace simulation */}
          <Route
            path="marketplace/client/products"
            element={
              <RequirePermission anyOf={["view_deliveries"]}>
                <MarketplaceClientProductsPage />
              </RequirePermission>
            }
          />
          <Route
            path="marketplace/client/cart"
            element={
              <RequirePermission anyOf={["view_deliveries"]}>
                <MarketplaceClientCartPage />
              </RequirePermission>
            }
          />
          <Route
            path="marketplace/seller/orders"
            element={
              <RequirePermission anyOf={["view_deliveries"]}>
                <MarketplaceSellerOrdersPage />
              </RequirePermission>
            }
          />
          <Route
            path="marketplace/seller/orders/:sellerOrderId"
            element={
              <RequirePermission anyOf={["view_deliveries"]}>
                <MarketplaceSellerOrderDetailPage />
              </RequirePermission>
            }
          />

          {/* Logistics / Delivery workspace */}
          <Route
            path="deliveries"
            element={
              <RequirePermission anyOf={["view_deliveries"]}>
                <DeliveryListPage />
              </RequirePermission>
            }
          />
          <Route
            path="deliveries/:id"
            element={
              <RequirePermission anyOf={["view_deliveries"]}>
                <DeliveryDetailPage />
              </RequirePermission>
            }
          />
          {/* Rides Administration (Phase 1): first-class ride list + detail */}
          <Route path="rides" element={<RequirePermission anyOf={["view_rides"]}><RidesListPage /></RequirePermission>} />
          <Route path="rides/anomalies" element={<RequirePermission anyOf={["view_rides"]}><RideAnomaliesPage /></RequirePermission>} />
          <Route path="rides/:rideId" element={<RequirePermission anyOf={["view_rides"]}><RideDetailPage /></RequirePermission>} />
          {/* Reverse logistics & returns (DLV-192) */}
          <Route
            path="returns/requests"
            element={
              <RequirePermission anyOf={["view_deliveries", "manage_deliveries"]}>
                <ReturnRequestsPage />
              </RequirePermission>
            }
          />
          <Route
            path="returns/reconciliation"
            element={
              <RequirePermission anyOf={["view_deliveries", "manage_deliveries"]}>
                <ReturnReconciliationPage />
              </RequirePermission>
            }
          />
          <Route
            path="returns/shipments/:shipmentId"
            element={
              <RequirePermission anyOf={["view_deliveries", "manage_deliveries"]}>
                <ReturnShipmentDetailPage />
              </RequirePermission>
            }
          />
          <Route
            path="returns"
            element={
              <RequirePermission anyOf={["view_deliveries"]}>
                <ReturnShipmentsPage />
              </RequirePermission>
            }
          />
          <Route
            path="disputes"
            element={
              <RequirePermission anyOf={["view_deliveries", "manage_deliveries"]}>
                <DisputesPage />
              </RequirePermission>
            }
          />
          <Route
            path="delivery-packages/:packageId/label"
            element={
              <RequirePermission anyOf={["view_delivery_labels"]}>
                <PackageLabelPage />
              </RequirePermission>
            }
          />
          <Route
            path="delivery-labels/print-queue"
            element={
              <RequirePermission anyOf={["print_delivery_labels"]}>
                <PrintQueuePage />
              </RequirePermission>
            }
          />
          <Route
            path="delivery-labels/exceptions"
            element={
              <RequirePermission anyOf={["view_delivery_labels"]}>
                <LabelExceptionsPage />
              </RequirePermission>
            }
          />
          <Route
            path="delivery-labels"
            element={
              <RequirePermission anyOf={["view_delivery_labels"]}>
                <DeliveryLabelsPage />
              </RequirePermission>
            }
          />
          <Route
            path="delivery-label-stock"
            element={
              <RequirePermission anyOf={["activate_blank_labels"]}>
                <BlankLabelStockPage />
              </RequirePermission>
            }
          />

          {/* Approvals */}
          <Route
            path="approvals"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <ApprovalsDashboard />
              </RequirePermission>
            }
          />
          <Route
            path="approvals/history"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <ApprovalsHistory />
              </RequirePermission>
            }
          />
          <Route
            path="approvals/:approvalId"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <ApprovalDetail />
              </RequirePermission>
            }
          />
          <Route
            path="documents/review"
            element={
              <RequirePermission anyOf={["manage_operations"]}>
                <DocumentReviewPage />
              </RequirePermission>
            }
          />

          {/* Product config */}
          <Route
            path="services"
            element={
              <RequirePermission anyOf={["manage_pricing"]}>
                <ServiceConfiguration />
              </RequirePermission>
            }
          />
          {/* Centralized pricing management — rides, deliveries, rentals, ambulances */}
          <Route
            path="pricing"
            element={
              <RequirePermission anyOf={["manage_pricing"]}>
                <PricingManagement />
              </RequirePermission>
            }
          />
          <Route
            path="pricing/zones"
            element={
              <RequirePermission anyOf={["manage_pricing"]}>
                <ZonesList />
              </RequirePermission>
            }
          />
          <Route
            path="pricing/overview"
            element={
              <RequirePermission anyOf={["manage_pricing"]}>
                <PricingRulesOverview />
              </RequirePermission>
            }
          />
          <Route
            path="pricing/geofences"
            element={
              <RequirePermission anyOf={["manage_pricing"]}>
                <ZonesGeofences />
              </RequirePermission>
            }
          />
          <Route
            path="pricing/new-zone"
            element={
              <RequirePermission anyOf={["manage_pricing"]}>
                <ZoneCreate />
              </RequirePermission>
            }
          />
          <Route
            path="pricing/map/:id"
            element={
              <RequirePermission anyOf={["manage_pricing"]}>
                <ZoneMapView />
              </RequirePermission>
            }
          />
          <Route
            path="pricing/detail/:id"
            element={
              <RequirePermission anyOf={["manage_pricing"]}>
                <ZonePricingDetail />
              </RequirePermission>
            }
          />
          <Route
            path="pricing/*"
            element={
              <RequirePermission anyOf={["manage_pricing"]}>
                <PricingManagement />
              </RequirePermission>
            }
          />
          <Route
            path="promos"
            element={
              <RequirePermission anyOf={["manage_promotions"]}>
                <PromotionsIncentives />
              </RequirePermission>
            }
          />
          <Route
            path="promos/:id"
            element={
              <RequirePermission anyOf={["manage_promotions"]}>
                <PromoDetail />
              </RequirePermission>
            }
          />
          <Route
            path="vertical-policies"
            element={
              <RequirePermission anyOf={["manage_pricing"]}>
                <VerticalPolicies />
              </RequirePermission>
            }
          />

          {/* Users & roles */}
          <Route
            path="agents"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <AgentManagement />
              </RequirePermission>
            }
          />
          <Route
            path="agents/:id"
            element={
              <RequirePermission anyOf={["manage_people"]}>
                <AgentDetail />
              </RequirePermission>
            }
          />
          <Route
            path="admin-users"
            element={
              <RequirePermission anyOf={["view_admin_users", "manage_admin_users"]}>
                <AdminUsersManagement />
              </RequirePermission>
            }
          />
          <Route
            path="admin-users/:id"
            element={
              <RequirePermission anyOf={["view_admin_users", "manage_admin_users"]}>
                <AdminUserDetail />
              </RequirePermission>
            }
          />
          <Route
            path="roles"
            element={
              <RequirePermission anyOf={["view_roles", "manage_roles"]}>
                <RolesPermissions />
              </RequirePermission>
            }
          />

          {/* Training & system */}
          <Route
            path="training"
            element={
              <RequirePermission anyOf={["manage_system"]}>
                <GlobalTrainingManager />
              </RequirePermission>
            }
          />
          <Route
            path="training/preview"
            element={
              <RequirePermission anyOf={["manage_system"]}>
                <TrainingModulePreview />
              </RequirePermission>
            }
          />
          <Route
            path="system/localization"
            element={
              <RequirePermission anyOf={["manage_system"]}>
                <LocalizationLanguageContent />
              </RequirePermission>
            }
          />
          <Route
            path="system/policy-rules"
            element={
              <RequirePermission anyOf={["manage_system", "manage_pricing"]}>
                <PolicyRuleManagement />
              </RequirePermission>
            }
          />
          <Route
            path="system/flags"
            element={
              <RequirePermission anyOf={["manage_system"]}>
                <FeatureFlagsExperiments />
              </RequirePermission>
            }
          />
          <Route
            path="system/flags/:id/results"
            element={
              <RequirePermission anyOf={["manage_system"]}>
                <ExperimentResults />
              </RequirePermission>
            }
          />
          <Route
            path="system/integrations"
            element={
              <RequirePermission anyOf={["manage_system"]}>
                <Integrations />
              </RequirePermission>
            }
          />
          <Route
            path="system/audit-log"
            element={
              <RequirePermission anyOf={["manage_system"]}>
                <AuditLog />
              </RequirePermission>
            }
          />
          <Route
            path="system/overview"
            element={
              <RequirePermission anyOf={["manage_system"]}>
                <SystemOverview />
              </RequirePermission>
            }
          />
          <Route path="settings" element={<Settings />} />

          <Route path="*" element={<Navigate to="/admin/home" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
