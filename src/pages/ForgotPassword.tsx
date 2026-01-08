// @ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Forgot Password - Step 1: Enter email to request reset link

const EV = {
  green: "#03CD8C",
  orange: "#F77F00",
  dark: "#0f172a",
  grayBorder: "#e2e8f0",
  grayText: "#64748b",
  lightGray: "#f8fafc",
  white: "#ffffff",
};

const MailIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="4" width="20" height="16" rx="3" stroke={EV.green} strokeWidth="1.5"/>
    <path d="M2 7l10 6 10-6" stroke={EV.green} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (val) =>
    /[^@\s]+@[^@\s]+\.[^@\s]+/.test(String(val).toLowerCase());

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setEmailErr("Please enter your email address");
      return;
    }
    if (!validateEmail(email)) {
      setEmailErr("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.logoContainer}>
            <div style={styles.logoDot} />
            <span style={styles.logoText}>EVzone</span>
          </div>

          <div style={styles.card}>
            <div style={styles.iconWrapper}>
              <MailIcon />
            </div>
            <h1 style={styles.title}>Check your email</h1>
            <p style={styles.subtitle}>
              We've sent a password reset link to<br />
              <strong style={{ color: EV.dark }}>{email}</strong>
            </p>
            <p style={styles.helpText}>
              Didn't receive the email? Check your spam folder or{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setIsSubmitted(false);
                }}
                style={styles.link}
              >
                try another email address
              </a>
            </p>
            <button
              style={styles.secondaryButton}
              onClick={() => navigate("/admin/login")}
            >
              <ArrowLeftIcon />
              Back to sign in
            </button>
          </div>

          <p style={styles.footer}>
            Need help? <a href="#" style={styles.link}>Contact Support</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.logoContainer}>
          <div style={styles.logoDot} />
          <span style={styles.logoText}>EVzone</span>
        </div>

        <div style={styles.card}>
          <h1 style={styles.title}>Forgot your password?</h1>
          <p style={styles.subtitle}>
            No worries! Enter your email address and we'll send you instructions to reset your password.
          </p>

          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email address</label>
              <input
                style={{
                  ...styles.input,
                  borderColor: emailErr ? "#fca5a5" : EV.grayBorder,
                  backgroundColor: emailErr ? "#fef2f2" : EV.white,
                }}
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailErr(""); }}
                placeholder="you@company.com"
                disabled={isLoading}
                autoFocus
              />
              {emailErr && <span style={styles.errorText}>{emailErr}</span>}
            </div>

            <button
              type="submit"
              style={{
                ...styles.submitButton,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "wait" : "pointer",
              }}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <button
            style={styles.backButton}
            onClick={() => navigate("/admin/login")}
          >
            <ArrowLeftIcon />
            Back to sign in
          </button>
        </div>

        <p style={styles.footer}>
          Remember your password? <a href="#" onClick={(e) => { e.preventDefault(); navigate("/admin/login"); }} style={styles.link}>Sign in</a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: `linear-gradient(135deg, ${EV.lightGray} 0%, ${EV.white} 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 440,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  logoDot: {
    width: 14,
    height: 14,
    borderRadius: 9999,
    background: EV.green,
  },
  logoText: {
    fontWeight: 700,
    fontSize: 22,
    color: EV.dark,
  },
  card: {
    width: "100%",
    background: EV.white,
    borderRadius: 16,
    padding: 40,
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    textAlign: "center",
  },
  iconWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
    color: EV.dark,
    letterSpacing: -0.5,
  },
  subtitle: {
    margin: "12px 0 0",
    fontSize: 15,
    color: EV.grayText,
    lineHeight: 1.6,
  },
  helpText: {
    margin: "20px 0",
    fontSize: 14,
    color: EV.grayText,
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    marginTop: 28,
    textAlign: "left",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: EV.dark,
  },
  input: {
    padding: "14px 16px",
    borderRadius: 10,
    border: `1px solid ${EV.grayBorder}`,
    fontSize: 15,
    outline: "none",
    transition: "all 0.2s ease",
    width: "100%",
    boxSizing: "border-box",
  },
  errorText: {
    fontSize: 13,
    color: "#dc2626",
    marginTop: 4,
  },
  submitButton: {
    padding: "14px 20px",
    borderRadius: 10,
    border: "none",
    background: EV.green,
    color: EV.white,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  secondaryButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "14px 20px",
    borderRadius: 10,
    border: `1px solid ${EV.grayBorder}`,
    background: EV.white,
    color: EV.dark,
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    width: "100%",
    marginTop: 16,
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "12px 20px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: EV.grayText,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    width: "100%",
    marginTop: 16,
  },
  link: {
    color: EV.green,
    textDecoration: "none",
    fontWeight: 500,
  },
  footer: {
    marginTop: 24,
    fontSize: 14,
    color: EV.grayText,
  },
};
