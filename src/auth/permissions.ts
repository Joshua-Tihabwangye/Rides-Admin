import type { AuthUser } from "./auth"
import type { AdminBackendRole } from "./auth"
import { getAuthPermissions } from "./auth"

export type AdminPermission =
  | "view_dashboard"
  | "manage_operations"
  | "manage_people"
  | "manage_companies"
  | "manage_finance"
  | "manage_pricing"
  | "manage_promotions"
  | "manage_admin_users"
  | "manage_roles"
  | "manage_system"
  // Logistics / delivery workspace (frontend permission strings).
  // Backend mappings: view_deliveries → delivery:read, manage_deliveries → delivery:write,
  // view_delivery_labels → delivery-label:read, print_delivery_labels → delivery-label:print,
  // regenerate_delivery_labels → delivery-label:regenerate, bulk_print_delivery_labels → delivery-label:bulk-print,
  // activate_blank_labels → blank-label:activate.
  | "view_deliveries"
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
  "manage_admin_users",
  "manage_roles",
  "manage_system",
  "view_deliveries",
  "manage_deliveries",
  "view_delivery_labels",
  "print_delivery_labels",
  "regenerate_delivery_labels",
  "bulk_print_delivery_labels",
  "activate_blank_labels",
]

const ROLE_PERMISSIONS: Record<AdminBackendRole, readonly AdminPermission[]> = {
  admin: [
    "view_dashboard",
    "manage_operations",
    "manage_people",
    "manage_companies",
    "manage_finance",
    "manage_pricing",
    "manage_promotions",
    "view_deliveries",
    "view_delivery_labels",
  ],
  super_admin: ALL_PERMISSIONS,
}

function normalizeRoles(roles: readonly string[]): AdminBackendRole[] {
  return Array.from(
    new Set(
      roles
        .filter((role): role is string => typeof role === "string")
        .map((role) => role.trim().toLowerCase())
        .filter((role): role is AdminBackendRole => role === "admin" || role === "super_admin"),
    ),
  )
}

export function getPermissionsForRoles(roles: readonly string[]): AdminPermission[] {
  const granted = new Set<AdminPermission>()
  for (const role of normalizeRoles(roles)) {
    for (const permission of ROLE_PERMISSIONS[role]) {
      granted.add(permission)
    }
  }
  return Array.from(granted)
}

export function getUserPermissions(user: AuthUser): AdminPermission[] {
  const backendPermissions = Array.isArray(user.permissions)
    ? user.permissions.filter((permission): permission is AdminPermission => ALL_PERMISSIONS.includes(permission as AdminPermission))
    : []
  if (backendPermissions.length > 0) {
    return Array.from(new Set(backendPermissions))
  }
  return getPermissionsForRoles(user.roles ?? [])
}

export function hasPermissionByRoles(roles: readonly string[], permission: AdminPermission): boolean {
  const backendPermissions = getAuthPermissions()
    .filter((value): value is AdminPermission => ALL_PERMISSIONS.includes(value as AdminPermission))
  if (backendPermissions.length > 0) {
    return new Set(backendPermissions).has(permission)
  }
  return new Set(getPermissionsForRoles(roles)).has(permission)
}

export function hasAnyPermission(user: AuthUser, required: AdminPermission[]): boolean {
  if (required.length === 0) return true
  const granted = new Set(getUserPermissions(user))
  return required.some((permission) => granted.has(permission))
}

export function hasAnyPermissionByRoles(roles: readonly string[], required: AdminPermission[]): boolean {
  if (required.length === 0) return true
  const backendPermissions = getAuthPermissions()
    .filter((value): value is AdminPermission => ALL_PERMISSIONS.includes(value as AdminPermission))
  const granted = new Set(backendPermissions.length > 0 ? backendPermissions : getPermissionsForRoles(roles))
  return required.some((permission) => granted.has(permission))
}
