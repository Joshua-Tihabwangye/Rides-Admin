// @ts-nocheck
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { requestPasswordReset, verifyPasswordResetOtp } from "../auth/auth";
import { readAuthPrefill, saveAuthPrefill } from "../auth/authPrefill";

const EV = {
  green: "#03CD8C",
  dark: "var(--ev-text, #0f172a)",
  grayBorder: "var(--ev-border, #e2e8f0)",
  grayText: "var(--ev-text-secondary, #64748b)",
  white: "var(--ev-paper, #ffffff)",
};

export default function VerifyResetOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = React.useMemo(() => readAuthPrefill(), []);
  const state = location.state || {};
  const [email, setEmail] = useState((state.email || prefill.email || prefill.identity || "").trim().toLowerCase());
  const [otp, setOtp] = useState(state.otp || "");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    if (!/[^@\s]+@[^@\s]+\.[^@\s]+/.test(String(email).toLowerCase())) {
      setError("Please enter a valid email address");
      return;
    }
    if (!/^\d{6}$/.test(String(otp))) {
      setError("Reset code must be 6 digits");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await verifyPasswordResetOtp(normalizedEmail, otp);
      saveAuthPrefill({ email: normalizedEmail, identity: normalizedEmail });
      navigate("/admin/reset-password", {
        replace: true,
        state: {
          email: normalizedEmail,
          otp,
          resetToken: result.resetToken,
          resetRequired: result.resetRequired,
        },
      });
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }
    setIsLoading(true);
    setError("");
    setInfo("");
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setInfo("A new 6-digit reset code has been sent.");
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "Unable to resend the reset code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Verify reset code</h1>
          <p style={styles.subtitle}>Enter the 6-digit code we sent before choosing a new password.</p>
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>Email address</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="Email address"
              disabled={isLoading}
            />
            <label style={styles.label}>Reset code</label>
            <input
              style={{ ...styles.input, letterSpacing: "0.3em", textAlign: "center" }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              placeholder="Reset code"
              disabled={isLoading}
            />
            {error ? <span style={styles.error}>{error}</span> : null}
            {info ? <span style={styles.info}>{info}</span> : null}
            <button type="submit" style={styles.primary} disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify code"}
            </button>
          </form>
          <button type="button" style={styles.secondary} onClick={() => void handleResend()} disabled={isLoading}>
            Resend code
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--ev-bg, #f8fafc)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  container: { width: "100%", maxWidth: 440 },
  card: {
    background: EV.white,
    borderRadius: 16,
    padding: 40,
    boxShadow: "var(--ev-card-shadow, 0 4px 24px rgba(0,0,0,0.06))",
  },
  title: { margin: 0, fontSize: 26, fontWeight: 700, color: EV.dark },
  subtitle: { margin: "12px 0 24px", fontSize: 15, color: EV.grayText, lineHeight: 1.6 },
  form: { display: "grid", gap: 12 },
  label: { fontSize: 13, fontWeight: 600, color: EV.dark },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: `1px solid ${EV.grayBorder}`,
    fontSize: 14,
    boxSizing: "border-box",
  },
  primary: {
    marginTop: 8,
    border: "none",
    borderRadius: 12,
    padding: "14px 16px",
    background: EV.green,
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondary: {
    marginTop: 12,
    width: "100%",
    border: `1px solid ${EV.grayBorder}`,
    borderRadius: 12,
    padding: "12px 16px",
    background: "#fff",
    color: EV.dark,
    fontWeight: 600,
    cursor: "pointer",
  },
  error: { color: "#dc2626", fontSize: 13 },
  info: { color: EV.green, fontSize: 13 },
}
