import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './auth/RequireAuth'
import RequirePermission from './auth/RequirePermission'
import AdminShell from './layout/AdminShell'
import AdminBackendBootstrap from './components/AdminBackendBootstrap'

function RouteLoading() {
  return (
    <div style={{ minHeight: 280, display: 'grid', placeItems: 'center', color: '#475569', fontSize: 13 }}>
      Loading...
    </div>
  )
}

const AdminAuthSignIn = lazy(() => import('./pages/AdminAuthSignIn'))
const AdminAuthSignUp = lazy(() => import('./pages/AdminAuthSignUp'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const VerifyResetOtp = lazy(() => import('./pages/VerifyResetOtp'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const AdminWelcomeNotice = lazy(() => import('./pages/AdminWelcomeNotice'))
const AdminOnboardingChecklist = lazy(() => import('./pages/AdminOnboardingChecklist'))
const AdminHomeDashboard = lazy(() => import('./pages/AdminHomeDashboard'))
const AdminProfileRegions = lazy(() => import('./pages/AdminProfileRegions'))
const AdminGlobalSearch = lazy(() => import('./pages/AdminGlobalSearch'))
const RiderManagement = lazy(() => import('./pages/RiderManagement'))
const RiderDetail = lazy(() => import('./pages/RiderDetail'))
const RiderCreate = lazy(() => import('./pages/RiderCreate'))
const DriverManagement = lazy(() => import('./pages/DriverManagement'))
const DriverDetail = lazy(() => import('./pages/DriverDetail'))
const DriverCreate = lazy(() => import('./pages/DriverCreate'))
const SafetyOverview = lazy(() => import('./pages/SafetyOverview'))
const SosIncidentDetailPage = lazy(() => import('./pages/SosIncidentDetailPage'))
const RiskFraudCenter = lazy(() => import('./pages/RiskFraudCenter'))
const RiskDetail = lazy(() => import('./pages/RiskDetail'))
const CompanyList = lazy(() => import('./pages/CompanyList'))
const CompanyDetail = lazy(() => import('./pages/CompanyDetail'))
const FinancialOverview = lazy(() => import('./pages/FinancialOverview'))
const CompanyPayouts = lazy(() => import('./pages/CompanyPayouts'))
const FinanceCashouts = lazy(() => import('./pages/FinanceCashouts'))
const FinancePayouts = lazy(() => import('./pages/FinancePayouts'))
const FinancePayments = lazy(() => import('./pages/FinancePayments'))
const FinanceSettlements = lazy(() => import('./pages/FinanceSettlements'))
const FinanceWalletReconciliation = lazy(() => import('./pages/FinanceWalletReconciliation'))
const FinanceReconciliationRuns = lazy(() => import('./pages/FinanceReconciliationRuns'))
const CompanyApprovals = lazy(() => import('./pages/CompanyApprovals'))
const RegionTaxConfigEditor = lazy(() => import('./pages/RegionTaxConfigEditor'))
const InvoiceTemplatePreview = lazy(() => import('./pages/InvoiceTemplatePreview'))
const OperationsDashboard = lazy(() => import('./pages/OperationsDashboard'))
const MonitoringPage = lazy(() => import('./pages/MonitoringPage'))
const LiveDriversMapPage = lazy(() => import('./pages/LiveDriversMapPage'))
const MatchingInspectionPage = lazy(() => import('./pages/MatchingInspectionPage'))
const DetailedAnalytics = lazy(() => import('./pages/DetailedAnalytics'))
const ApprovalsDashboard = lazy(() => import('./pages/ApprovalsDashboard'))
const ApprovalDetail = lazy(() => import('./pages/ApprovalDetail'))
const DocumentReviewPage = lazy(() => import('./pages/DocumentReviewPage'))
const ServiceConfiguration = lazy(() => import('./pages/ServiceConfiguration'))
const PricingManagement = lazy(() => import('./pages/PricingManagement'))
const PricingRulesOverview = lazy(() => import('./pages/PricingRulesTariffs'))
const ZoneCreate = lazy(() => import('./pages/ZoneCreate'))
const ZonesGeofences = lazy(() => import('./pages/ZonesGeofences'))
const ZoneMapView = lazy(() => import('./pages/ZoneMapView'))
const ZonePricingDetail = lazy(() => import('./pages/ZonePricingDetail'))
const ZonesList = lazy(() => import('./pages/ZonesList'))
const PromotionsIncentives = lazy(() => import('./pages/PromotionsIncentives'))
const PromoDetail = lazy(() => import('./pages/PromoDetail'))
const VerticalPolicies = lazy(() => import('./pages/VerticalPolicies'))
const AgentManagement = lazy(() => import('./pages/AgentManagement'))
const AgentDetail = lazy(() => import('./pages/AgentDetail'))
const AdminUsersManagement = lazy(() => import('./pages/AdminUsersManagement'))
const AdminUserDetail = lazy(() => import('./pages/AdminUserDetail'))
const RolesPermissions = lazy(() => import('./pages/RolesPermissions'))
const GlobalTrainingManager = lazy(() => import('./pages/GlobalTrainingManager'))
const TrainingModulePreview = lazy(() => import('./pages/TrainingModulePreview'))
const LocalizationLanguageContent = lazy(() => import('./pages/LocalizationLanguageContent'))
const PolicyRuleManagement = lazy(() => import('./pages/PolicyRuleManagement'))
const FeatureFlagsExperiments = lazy(() => import('./pages/FeatureFlagsExperiments'))
const ExperimentResults = lazy(() => import('./pages/ExperimentResults'))
const ApprovalsHistory = lazy(() => import('./pages/ApprovalsHistory'))
const Integrations = lazy(() => import('./pages/Integrations'))
const AuditLog = lazy(() => import('./pages/AuditLog'))
const SystemOverview = lazy(() => import('./pages/SystemOverview'))
const Settings = lazy(() => import('./pages/Settings'))
const AccessDenied = lazy(() => import('./pages/AccessDenied'))
const DeliveryListPage = lazy(() => import('./pages/DeliveryListPage'))
const DeliveryDetailPage = lazy(() => import('./pages/DeliveryDetailPage'))
const RidesListPage = lazy(() => import('./pages/RidesListPage'))
const RideDetailPage = lazy(() => import('./pages/RideDetailPage'))
const RideAnomaliesPage = lazy(() => import('./pages/RideAnomaliesPage'))
const ReturnRequestsPage = lazy(() => import('./pages/ReturnRequestsPage'))
const DisputesPage = lazy(() => import('./pages/DisputesPage'))
const ReturnShipmentsPage = lazy(() => import('./pages/ReturnShipmentsPage'))
const ReturnShipmentDetailPage = lazy(() => import('./pages/ReturnShipmentDetailPage'))
const ReturnReconciliationPage = lazy(() => import('./pages/ReturnReconciliationPage'))
const PackageLabelPage = lazy(() => import('./pages/PackageLabelPage'))
const DeliveryLabelsPage = lazy(() => import('./pages/DeliveryLabelsPage'))
const PrintQueuePage = lazy(() => import('./pages/PrintQueuePage'))
const LabelExceptionsPage = lazy(() => import('./pages/LabelExceptionsPage'))
const BlankLabelStockPage = lazy(() => import('./pages/BlankLabelStockPage'))
const MarketplaceClientProductsPage = lazy(() => import('./pages/marketplace/MarketplaceClientProductsPage'))
const MarketplaceClientCartPage = lazy(() => import('./pages/marketplace/MarketplaceClientCartPage'))
const MarketplaceSellerOrdersPage = lazy(() => import('./pages/marketplace/MarketplaceSellerOrdersPage'))
const MarketplaceSellerOrderDetailPage = lazy(() => import('./pages/marketplace/MarketplaceSellerOrderDetailPage'))

export default function App() {
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
              <RequirePermission anyOf={["manage_admin_users"]}>
                <AdminUsersManagement />
              </RequirePermission>
            }
          />
          <Route
            path="admin-users/:id"
            element={
              <RequirePermission anyOf={["manage_admin_users"]}>
                <AdminUserDetail />
              </RequirePermission>
            }
          />
          <Route
            path="roles"
            element={
              <RequirePermission anyOf={["manage_roles"]}>
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
