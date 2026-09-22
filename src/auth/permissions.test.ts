import { describe, expect, it } from "vitest"
import type { AuthUser } from "./auth"
import { getPermissionsForRoles, getUserPermissions } from "./permissions"

const baseUser: AuthUser = {
  name: "Admin",
  email: "admin@example.com",
  role: "Admin",
  roles: ["admin"],
}

describe("admin permission resolution", () => {
  it("expands backend wildcard permissions to all frontend permissions", () => {
    const permissions = getUserPermissions({ ...baseUser, permissions: ["*"] })

    expect(permissions).toContain("manage_system")
    expect(permissions).toContain("manage_admin_users")
    expect(permissions).toContain("manage_finance")
  })

  it("scopes permissions to the active login role when one is selected", () => {
    const permissions = getUserPermissions({
      ...baseUser,
      roles: ["super_admin", "finance_admin", "admin"],
      activeRole: "finance_admin",
      permissions: ["*"],
    })

    expect(permissions).toContain("manage_finance")
    expect(permissions).not.toContain("manage_system")
    expect(permissions).not.toContain("manage_admin_users")
  })

  it("maps named admin roles to their expected areas", () => {
    expect(getPermissionsForRoles(["admin"])).toEqual(expect.arrayContaining([
      "view_admin_users",
      "view_roles",
      "view_delivery_labels",
      "print_delivery_labels",
      "activate_blank_labels",
    ]))
    expect(getPermissionsForRoles(["admin"])).not.toContain("manage_admin_users")
    expect(getPermissionsForRoles(["admin"])).not.toContain("manage_roles")
    expect(getPermissionsForRoles(["super_admin"])).toContain("manage_roles")
    expect(getPermissionsForRoles(["finance_admin"])).toContain("manage_finance")
    expect(getPermissionsForRoles(["operations_admin"])).toContain("manage_operations")
    expect(getPermissionsForRoles(["support_admin"])).toContain("manage_people")
  })

  it("maps canonical backend permissions to frontend page access", () => {
    const permissions = getUserPermissions({
      ...baseUser,
      activeRole: undefined,
      roles: [],
      permissions: ["admin:user:read", "governance:config:write"],
    })

    expect(permissions).toEqual(expect.arrayContaining(["view_admin_users", "view_roles", "manage_roles"]))
    expect(permissions).not.toContain("manage_admin_users")
  })
})
