// @ts-nocheck
import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { registerWithCredentials, signOut } from "../auth/auth"
import { clearAuthPrefillPassword, saveAuthPrefill } from "../auth/authPrefill"

const EV = {
  green: "#03CD8C",
  dark: "var(--ev-text, #0f172a)",
  grayBorder: "var(--ev-border, #e2e8f0)",
  grayText: "var(--ev-text-secondary, #64748b)",
  white: "var(--ev-paper, #ffffff)",
}

function isValidEmail(value) {
  return /[^@\s]+@[^@\s]+\.[^@\s]+/.test(String(value).trim().toLowerCase())
}

export default function AdminAuthSignUp() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    const normalizedEmail = email.trim().toLowerCase()
    if (!fullName.trim()) {
      setError("Full name is required.")
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

    setIsSubmitting(true)
    try {
      const authUser = await registerWithCredentials({
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: phone.trim() || undefined,
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
        <p style={styles.subtitle}>Register an admin account and continue straight into the portal.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.field}>
            <span style={styles.label}>Full name</span>
            <input
              style={styles.input}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Operations Admin"
              disabled={isSubmitting}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Email</span>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@company.com"
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
              placeholder="+2567..."
              disabled={isSubmitting}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Password</span>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a secure password"
              disabled={isSubmitting}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Confirm password</span>
            <input
              style={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
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

const styles = {
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
  input: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    border: `1px solid ${EV.grayBorder}`,
    padding: "0 14px",
    fontSize: 15,
    boxSizing: "border-box",
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
