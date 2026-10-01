import { describe, expect, it } from "vitest"
import type { AuthUser } from "./auth"
import { getUserPermissions } from "./permissions"

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

  it("uses the backend-issued permission list as returned", () => {
    const permissions = getUserPermissions({
      ...baseUser,
      roles: ["finance_admin"],
      permissions: ["finance:revenue:read"],
    })

    expect(permissions).toEqual(["manage_finance"])
  })

  it("grants nothing locally when the backend sends no permissions", () => {
    expect(getUserPermissions({ ...baseUser, roles: ["super_admin"], permissions: [] })).toEqual([])
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
