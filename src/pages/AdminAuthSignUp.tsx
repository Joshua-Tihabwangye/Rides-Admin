import React, { useState } from "react"
import type { CSSProperties, FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ADMIN_ROLE_OPTIONS, registerWithCredentials, signOut } from "../auth/auth"
import type { AdminBackendRole } from "../auth/auth"
import { clearAuthPrefillPassword, saveAuthPrefill } from "../auth/authPrefill"

const EV = {
  green: "#03CD8C",
  dark: "var(--ev-text, #0f172a)",
  grayBorder: "var(--ev-border, #e2e8f0)",
  grayText: "var(--ev-text-secondary, #64748b)",
  white: "var(--ev-paper, #ffffff)",
}

function isValidEmail(value: string) {
  return /[^@\s]+@[^@\s]+\.[^@\s]+/.test(value.trim().toLowerCase())
}

export default function AdminAuthSignUp() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<AdminBackendRole | "">("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [missingFields, setMissingFields] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const signupRoleOptions = ADMIN_ROLE_OPTIONS.filter((option) => option.value !== "super_admin")

  const fieldStyle = (field: string): CSSProperties => ({
    ...styles.input,
    ...(missingFields.has(field) ? styles.inputMissing : {}),
  })

  const missingRibbon = (field: string) =>
    missingFields.has(field) ? <span style={styles.missingRibbon}>Missing</span> : null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setMissingFields(new Set())

    const normalizedEmail = email.trim().toLowerCase()
    const missing = new Set<string>()
    if (!fullName.trim()) missing.add("fullName")
    if (!normalizedEmail) missing.add("email")
    if (!role) missing.add("role")
    if (!password) missing.add("password")
    if (!confirmPassword) missing.add("confirmPassword")
    if (missing.size > 0) {
      setMissingFields(missing)
      setError("Complete the missing required fields.")
      return
    }
    if (!isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    const selectedRole = role as AdminBackendRole

    setIsSubmitting(true)
    try {
      await registerWithCredentials({
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: phone.trim() || undefined,
        role: selectedRole,
        password,
      })
      saveAuthPrefill({ email: normalizedEmail, identity: normalizedEmail })
      clearAuthPrefillPassword()
      signOut()
      navigate("/admin/login", { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign up failed. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brandRow}>
          <div style={styles.logoDot} />
          <span style={styles.logoText}>EVzone</span>
        </div>
        <h1 style={styles.title}>Create admin account</h1>
        <p style={styles.subtitle}>Register an admin account, then sign in with your backend session.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.field}>
            <span style={styles.labelRow}><span style={styles.label}>Full name</span>{missingRibbon("fullName")}</span>
            <input
              style={fieldStyle("fullName")}
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value)
                setMissingFields((prev) => {
                  const next = new Set(prev)
                  next.delete("fullName")
                  return next
                })
              }}
              placeholder="Full name"
              disabled={isSubmitting}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.labelRow}><span style={styles.label}>Email</span>{missingRibbon("email")}</span>
            <input
              style={fieldStyle("email")}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setMissingFields((prev) => {
                  const next = new Set(prev)
                  next.delete("email")
                  return next
                })
              }}
              placeholder="Email address"
              disabled={isSubmitting}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Phone</span>
            <input
              style={styles.input}
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Phone number"
              disabled={isSubmitting}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.labelRow}><span style={styles.label}>Admin role</span>{missingRibbon("role")}</span>
            <select
              style={fieldStyle("role")}
              value={role}
              onChange={(event) => {
                setRole(event.target.value as AdminBackendRole)
                setMissingFields((prev) => {
                  const next = new Set(prev)
                  next.delete("role")
                  return next
                })
              }}
              disabled={isSubmitting}
            >
              <option value="">Select role</option>
              {signupRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span style={styles.helpText}>
              {role ? ADMIN_ROLE_OPTIONS.find((option) => option.value === role)?.description : "Super Admin is assigned from Admin Users after account creation."}
            </span>
          </label>

          <label style={styles.field}>
            <span style={styles.labelRow}><span style={styles.label}>Password</span>{missingRibbon("password")}</span>
            <input
              style={fieldStyle("password")}
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setMissingFields((prev) => {
                  const next = new Set(prev)
                  next.delete("password")
                  return next
                })
              }}
              placeholder="Create a secure password"
              disabled={isSubmitting}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.labelRow}><span style={styles.label}>Confirm password</span>{missingRibbon("confirmPassword")}</span>
            <input
              style={fieldStyle("confirmPassword")}
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
                setMissingFields((prev) => {
                  const next = new Set(prev)
                  next.delete("confirmPassword")
                  return next
                })
              }}
              placeholder="Repeat your password"
              disabled={isSubmitting}
            />
          </label>

          {error ? <div style={styles.error}>{error}</div> : null}

          <button type="submit" style={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create admin account"}
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account? <Link to="/admin/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "var(--ev-bg, #f8fafc)",
  },
  card: {
    width: "100%",
    maxWidth: 460,
    background: EV.white,
    borderRadius: 20,
    padding: 32,
    boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  logoDot: {
    width: 14,
    height: 14,
    borderRadius: 9999,
    background: EV.green,
  },
  logoText: {
    color: EV.dark,
    fontWeight: 800,
    fontSize: 22,
  },
  title: {
    margin: 0,
    color: EV.dark,
    fontSize: 32,
    fontWeight: 900,
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 24,
    color: EV.grayText,
    lineHeight: 1.5,
  },
  form: {
    display: "grid",
    gap: 16,
  },
  field: {
    display: "grid",
    gap: 8,
  },
  label: {
    color: EV.dark,
    fontSize: 14,
    fontWeight: 700,
  },
  labelRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  missingRibbon: {
    borderRadius: 999,
    background: "#dc2626",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: 900,
    padding: "3px 8px",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    border: `1px solid ${EV.grayBorder}`,
    padding: "0 14px",
    fontSize: 15,
    boxSizing: "border-box",
  },
  inputMissing: {
    borderColor: "#dc2626",
    background: "#fef2f2",
  },
  helpText: {
    color: EV.grayText,
    fontSize: 12,
    lineHeight: 1.4,
  },
  error: {
    borderRadius: 12,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    padding: 12,
    fontSize: 14,
    lineHeight: 1.4,
  },
  submitButton: {
    marginTop: 4,
    height: 50,
    border: 0,
    borderRadius: 12,
    background: EV.green,
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
  },
  footerText: {
    marginTop: 20,
    marginBottom: 0,
    color: EV.grayText,
    fontSize: 14,
  },
  link: {
    color: EV.green,
    fontWeight: 800,
    textDecoration: "none",
  },
}
