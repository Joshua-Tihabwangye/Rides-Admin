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
    expect(getPermissionsForRoles(["super_admin"])).toContain("manage_roles")
    expect(getPermissionsForRoles(["finance_admin"])).toContain("manage_finance")
    expect(getPermissionsForRoles(["operations_admin"])).toContain("manage_operations")
    expect(getPermissionsForRoles(["support_admin"])).toContain("manage_people")
  })
})
