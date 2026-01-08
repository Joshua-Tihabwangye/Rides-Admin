// @ts-nocheck
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Reset Password - Step 2: Enter new password (accessed via reset link)

const EV = {
  green: "#03CD8C",
  orange: "#F77F00",
  dark: "#0f172a",
  grayBorder: "#e2e8f0",
  grayText: "#64748b",
  lightGray: "#f8fafc",
  white: "#ffffff",
};

const LockIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke={EV.green} strokeWidth="1.5"/>
    <path d="M7 11V7a5 5 0 0110 0v4" stroke={EV.green} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1.5" fill={EV.green}/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={EV.green} strokeWidth="1.5"/>
    <path d="M8 12l2.5 2.5L16 9" stroke={EV.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    {open ? (
      <>
        <path d="M12 5C7 5 3.3 8.1 2 12c1.3 3.9 5 7 10 7s8.7-3.1 10-7c-1.3-3.9-5-7-10-7Z" stroke="#64748b" strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="3" stroke="#64748b" strokeWidth="1.5"/>
      </>
    ) : (
      <>
        <path d="M3 3l18 18" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 5c-5 0-8.7 3.1-10 7 .5 1.5 1.4 2.9 2.5 4M12 19c5 0 8.7-3.1 10-7-.5-1.5-1.4-2.9-2.5-4" stroke="#64748b" strokeWidth="1.5"/>
      </>
    )}
  </svg>
);

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const strengthScore = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (strengthScore <= 2) return { label: "Weak", color: "#dc2626" };
    if (strengthScore <= 3) return { label: "Fair", color: "#d97706" };
    if (strengthScore <= 4) return { label: "Good", color: "#2563eb" };
    return { label: "Strong", color: EV.green };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!password) {
      newErrors.password = "Please enter a new password";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSuccess(true);
  };

  // Invalid/expired token state
  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.logoContainer}>
            <div style={styles.logoDot} />
            <span style={styles.logoText}>EVzone</span>
          </div>

          <div style={styles.card}>
            <div style={styles.iconWrapper}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="1.5"/>
                <path d="M12 8v4M12 16h.01" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 style={styles.title}>Invalid reset link</h1>
            <p style={styles.subtitle}>
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <button
              style={styles.submitButton}
              onClick={() => navigate("/admin/forgot-password")}
            >
              Request new link
            </button>
            <button
              style={styles.backButton}
              onClick={() => navigate("/admin/login")}
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.logoContainer}>
            <div style={styles.logoDot} />
            <span style={styles.logoText}>EVzone</span>
          </div>

          <div style={styles.card}>
            <div style={styles.iconWrapper}>
              <CheckCircleIcon />
            </div>
            <h1 style={styles.title}>Password reset successful</h1>
            <p style={styles.subtitle}>
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <button
              style={styles.submitButton}
              onClick={() => navigate("/admin/login")}
            >
              Sign in to your account
            </button>
          </div>
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
          <div style={styles.iconWrapper}>
            <LockIcon />
          </div>
          <h1 style={styles.title}>Set new password</h1>
          <p style={styles.subtitle}>
            Your new password must be different from previously used passwords.
          </p>

          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>New password</label>
              <div style={styles.passwordWrapper}>
                <input
                  style={{
                    ...styles.input,
                    borderColor: errors.password ? "#fca5a5" : EV.grayBorder,
                    backgroundColor: errors.password ? "#fef2f2" : EV.white,
                    paddingRight: 48,
                  }}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: "" }); }}
                  placeholder="Enter new password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {errors.password && <span style={styles.errorText}>{errors.password}</span>}
              
              {/* Password strength indicator */}
              {password && (
                <div style={styles.strengthContainer}>
                  <div style={styles.strengthBars}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        style={{
                          ...styles.strengthBar,
                          backgroundColor: i <= strengthScore ? getStrengthLabel().color : "#e2e8f0",
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ ...styles.strengthLabel, color: getStrengthLabel().color }}>
                    {getStrengthLabel().label}
                  </span>
                </div>
              )}

              {/* Password requirements */}
              <div style={styles.requirements}>
                <RequirementItem met={hasMinLength} text="At least 8 characters" />
                <RequirementItem met={hasUppercase} text="One uppercase letter" />
                <RequirementItem met={hasLowercase} text="One lowercase letter" />
                <RequirementItem met={hasNumber} text="One number" />
                <RequirementItem met={hasSpecial} text="One special character" />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirm password</label>
              <div style={styles.passwordWrapper}>
                <input
                  style={{
                    ...styles.input,
                    borderColor: errors.confirmPassword ? "#fca5a5" : EV.grayBorder,
                    backgroundColor: errors.confirmPassword ? "#fef2f2" : EV.white,
                    paddingRight: 48,
                  }}
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors({ ...errors, confirmPassword: "" }); }}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <EyeIcon open={showConfirmPassword} />
                </button>
              </div>
              {errors.confirmPassword && <span style={styles.errorText}>{errors.confirmPassword}</span>}
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
              {isLoading ? "Resetting password..." : "Reset password"}
            </button>
          </form>

          <button
            style={styles.backButton}
            onClick={() => navigate("/admin/login")}
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

function RequirementItem({ met, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        {met ? (
          <path d="M5 12l5 5L20 7" stroke={EV.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        ) : (
          <circle cx="12" cy="12" r="4" fill="#e2e8f0"/>
        )}
      </svg>
      <span style={{ fontSize: 12, color: met ? EV.green : EV.grayText }}>{text}</span>
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
  passwordWrapper: {
    position: "relative",
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 13,
    color: "#dc2626",
    marginTop: 4,
  },
  strengthContainer: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  strengthBars: {
    display: "flex",
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    transition: "background-color 0.2s ease",
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: 600,
  },
  requirements: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 12,
    padding: 12,
    background: EV.lightGray,
    borderRadius: 8,
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
};
