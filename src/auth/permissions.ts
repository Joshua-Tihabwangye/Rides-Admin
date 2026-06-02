import type { AuthUser } from "./auth"
import type { AdminBackendRole } from "./auth"

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
  return getPermissionsForRoles(user.roles ?? [])
}

export function hasPermissionByRoles(roles: readonly string[], permission: AdminPermission): boolean {
  return new Set(getPermissionsForRoles(roles)).has(permission)
}

export function hasAnyPermission(user: AuthUser, required: AdminPermission[]): boolean {
  if (required.length === 0) return true
  const granted = new Set(getUserPermissions(user))
  return required.some((permission) => granted.has(permission))
}

export function hasAnyPermissionByRoles(roles: readonly string[], required: AdminPermission[]): boolean {
  if (required.length === 0) return true
  const granted = new Set(getPermissionsForRoles(roles))
  return required.some((permission) => granted.has(permission))
}
