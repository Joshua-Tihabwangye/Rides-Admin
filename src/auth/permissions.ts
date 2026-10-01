import type { AuthUser } from "./auth"
import { getAuthPermissions } from "./auth"

export type AdminPermission =
  | "view_dashboard"
  | "manage_operations"
  | "manage_people"
  | "manage_companies"
  | "manage_finance"
  | "manage_pricing"
  | "manage_promotions"
  | "view_admin_users"
  | "manage_admin_users"
  | "view_roles"
  | "manage_roles"
  | "manage_system"
  // Logistics / delivery workspace (frontend permission strings).
  // Backend mappings: view_deliveries → delivery:read, manage_deliveries → delivery:write,
  // view_delivery_labels → delivery-label:read, print_delivery_labels → delivery-label:print,
  // regenerate_delivery_labels → delivery-label:regenerate, bulk_print_delivery_labels → delivery-label:bulk-print,
  // activate_blank_labels → blank-label:activate.
  | "view_deliveries"
  | "view_rides"
  | "manage_rides"
  | "manage_deliveries"
  | "view_delivery_labels"
  | "print_delivery_labels"
  | "regenerate_delivery_labels"
  | "bulk_print_delivery_labels"
  | "activate_blank_labels"

const ALL_PERMISSIONS: AdminPermission[] = [
  "view_dashboard",
  "manage_operations",
  "manage_people",
  "manage_companies",
  "manage_finance",
  "manage_pricing",
  "manage_promotions",
  "view_admin_users",
  "manage_admin_users",
  "view_roles",
  "manage_roles",
  "manage_system",
  "view_deliveries",
  "view_rides",
  "manage_rides",
  "manage_deliveries",
  "view_delivery_labels",
  "print_delivery_labels",
  "regenerate_delivery_labels",
  "bulk_print_delivery_labels",
  "activate_blank_labels",
]

const BACKEND_PERMISSION_ALIASES: Record<string, readonly AdminPermission[]> = {
  "admin:user:read": ["view_admin_users", "view_roles"],
  "admin:user:suspend": ["manage_admin_users"],
  "governance:config:write": ["manage_roles"],
  "governance:flag:write": ["manage_system"],
  "governance:risk-case:write": ["manage_people"],
  "governance:approval:decide": ["manage_operations"],
  "agent:read": ["manage_people"],
  "agent:case:write": ["manage_people"],
  "dispatch:read": ["manage_operations"],
  "dispatch:manual-booking:create": ["manage_operations"],
  "dispatch:driver:assign": ["manage_operations"],
  "dispatch:match:run": ["manage_operations"],
  "ride:read": ["view_rides"],
  "ride:manage": ["view_rides", "manage_rides"],
  "delivery:read": ["view_deliveries"],
  "delivery:update": ["view_deliveries", "manage_deliveries"],
  "delivery-label:read": ["view_delivery_labels"],
  "delivery-label:print": ["view_delivery_labels", "print_delivery_labels"],
  "delivery-label:regenerate": ["view_delivery_labels", "regenerate_delivery_labels"],
  "delivery-label:bulk-print": ["view_delivery_labels", "bulk_print_delivery_labels"],
  "blank-label:activate": ["view_delivery_labels", "activate_blank_labels"],
  "finance:cashout:read": ["manage_finance"],
  "finance:payout:read": ["manage_finance"],
  "finance:revenue:read": ["manage_finance"],
  "finance:settlement:write": ["manage_finance"],
  "partner:admin:read": ["manage_companies"],
  "partner:admin:write": ["manage_companies"],
  "marketplace:product:read": ["view_deliveries"],
  "marketplace:simulate": ["view_deliveries"],
  "merchant:order:read": ["view_deliveries"],
  "operations.*": ["manage_operations"],
  "dispatch.*": ["manage_operations"],
  "finance.*": ["manage_finance"],
  "pricing.*": ["manage_pricing"],
  "approvals.*": ["manage_operations"],
  "risk.*": ["manage_people"],
  "support.*": ["manage_people"],
  "users.read": ["manage_people"],
  "rides.read": ["view_rides"],
  "services.read": ["manage_pricing"],
  "companies.read": ["manage_companies"],
  "audit.read": ["manage_system"],
}

function expandPermissionAliases(values: readonly string[] | undefined): AdminPermission[] {
  const granted = new Set<AdminPermission>()
  for (const value of values ?? []) {
    if (value === "*") return [...ALL_PERMISSIONS]
    if (ALL_PERMISSIONS.includes(value as AdminPermission)) {
      granted.add(value as AdminPermission)
    }
    for (const permission of BACKEND_PERMISSION_ALIASES[value] ?? []) {
      granted.add(permission)
    }
  }
  return Array.from(granted)
}

export function getUserPermissions(user: AuthUser): AdminPermission[] {
  return expandPermissionAliases(user.permissions)
}

/** Checks the signed-in admin's backend-issued permissions; nothing is granted locally. */
export function hasAuthPermission(permission: AdminPermission): boolean {
  return new Set(expandPermissionAliases(getAuthPermissions())).has(permission)
}

export function hasAnyPermission(user: AuthUser, required: AdminPermission[]): boolean {
  if (required.length === 0) return true
  const granted = new Set(getUserPermissions(user))
  return required.some((permission) => granted.has(permission))
}
