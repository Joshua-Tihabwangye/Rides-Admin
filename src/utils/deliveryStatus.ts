/**
 * EVzone Rides-Admin – canonical delivery order statuses (DLV-014).
 *
 * These values must stay in sync with the backend DeliveryStatus enum defined
 * in EVzone-Ride-Backend/src/deliveries/delivery-status-machine.ts (DLV-010).
 * The admin portal uses them for filters, badges, and API queries so that an
 * unknown status is never silently coerced into a different value.
 */

export const DELIVERY_STATUS = [
  "CREATED",
  "WAITING_ACCEPTANCE",
  "PAYMENT_PENDING",
  "ACCEPTED",
  "DRIVER_ASSIGNED",
  "EN_ROUTE_PICKUP",
  "ARRIVED_PICKUP",
  "QR_VERIFIED",
  "PICKED_UP",
  "IN_TRANSIT",
  "ARRIVED_DROPOFF",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUS)[number];

export interface DeliveryStatusOption {
  value: DeliveryStatus | "";
  label: string;
}

/**
 * Filter dropdown options exposed on the delivery list page. The value sent to
 * the API is the exact backend enum value.
 */
export const DELIVERY_STATUS_FILTER_OPTIONS: DeliveryStatusOption[] = [
  { value: "", label: "All statuses" },
  { value: "CREATED", label: "Created" },
  { value: "WAITING_ACCEPTANCE", label: "Waiting acceptance" },
  { value: "PAYMENT_PENDING", label: "Payment pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "DRIVER_ASSIGNED", label: "Driver assigned" },
  { value: "EN_ROUTE_PICKUP", label: "En route to pickup" },
  { value: "ARRIVED_PICKUP", label: "Arrived at pickup" },
  { value: "QR_VERIFIED", label: "QR verified" },
  { value: "PICKED_UP", label: "Picked up" },
  { value: "IN_TRANSIT", label: "In transit" },
  { value: "ARRIVED_DROPOFF", label: "Arrived at drop-off" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  CREATED: "Created",
  WAITING_ACCEPTANCE: "Waiting acceptance",
  PAYMENT_PENDING: "Payment pending",
  ACCEPTED: "Accepted",
  DRIVER_ASSIGNED: "Driver assigned",
  EN_ROUTE_PICKUP: "En route to pickup",
  ARRIVED_PICKUP: "Arrived at pickup",
  QR_VERIFIED: "QR verified",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  ARRIVED_DROPOFF: "Arrived at drop-off",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

export interface DeliveryStatusBadgeConfig {
  color: string;
  bgColor: string;
  label: string;
}

const STATUS_BADGE_CONFIG: Record<DeliveryStatus, DeliveryStatusBadgeConfig> = {
  CREATED: { color: "#64748b", bgColor: "rgba(100, 116, 139, 0.12)", label: "Created" },
  WAITING_ACCEPTANCE: { color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.12)", label: "Waiting acceptance" },
  PAYMENT_PENDING: { color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.12)", label: "Payment pending" },
  ACCEPTED: { color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.12)", label: "Accepted" },
  DRIVER_ASSIGNED: { color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.12)", label: "Driver assigned" },
  EN_ROUTE_PICKUP: { color: "#8b5cf6", bgColor: "rgba(139, 92, 246, 0.12)", label: "En route to pickup" },
  ARRIVED_PICKUP: { color: "#8b5cf6", bgColor: "rgba(139, 92, 246, 0.12)", label: "Arrived at pickup" },
  QR_VERIFIED: { color: "#06b6d4", bgColor: "rgba(6, 182, 212, 0.12)", label: "QR verified" },
  PICKED_UP: { color: "#06b6d4", bgColor: "rgba(6, 182, 212, 0.12)", label: "Picked up" },
  IN_TRANSIT: { color: "#10b981", bgColor: "rgba(16, 185, 129, 0.12)", label: "In transit" },
  ARRIVED_DROPOFF: { color: "#f97316", bgColor: "rgba(249, 115, 22, 0.12)", label: "Arrived at drop-off" },
  DELIVERED: { color: "#10b981", bgColor: "rgba(16, 185, 129, 0.12)", label: "Delivered" },
  COMPLETED: { color: "#10b981", bgColor: "rgba(16, 185, 129, 0.12)", label: "Completed" },
  CANCELLED: { color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.12)", label: "Cancelled" },
  REJECTED: { color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.12)", label: "Rejected" },
};

const UNKNOWN_STATUS_CONFIG: DeliveryStatusBadgeConfig = {
  color: "#64748b",
  bgColor: "rgba(100, 116, 139, 0.12)",
  label: "",
};

/**
 * Normalize a raw status string to a canonical DeliveryStatus value.
 * Returns null when the value is not one of the backend-supported statuses so
 * callers can decide whether to display it as-is instead of coercing it.
 */
export function normalizeDeliveryStatus(value: string): DeliveryStatus | null {
  const normalized = value.trim().toUpperCase();
  return (DELIVERY_STATUS as readonly string[]).includes(normalized)
    ? (normalized as DeliveryStatus)
    : null;
}

/**
 * Human-readable label for a delivery status. Unknown values are returned
 * unchanged so they remain visible to ops instead of being hidden.
 */
export function getDeliveryStatusLabel(status: string): string {
  const canonical = normalizeDeliveryStatus(status);
  if (canonical) return STATUS_LABELS[canonical];
  return status;
}

/**
 * Badge color/label configuration for a delivery status. Unknown statuses keep
 * the raw value as the label (with neutral styling) rather than being coerced.
 */
export function getDeliveryStatusBadgeConfig(
  status: string,
): DeliveryStatusBadgeConfig {
  const canonical = normalizeDeliveryStatus(status);
  if (canonical) return STATUS_BADGE_CONFIG[canonical];
  return { ...UNKNOWN_STATUS_CONFIG, label: status };
}

/**
 * Options suitable for a `<Select>` filter. The empty value means "no filter".
 */
export function getDeliveryStatusFilterOptions(): DeliveryStatusOption[] {
  return [...DELIVERY_STATUS_FILTER_OPTIONS];
}
