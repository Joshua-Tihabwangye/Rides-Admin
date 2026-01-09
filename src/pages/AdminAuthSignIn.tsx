// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signIn } from "../auth/auth";

// Professional Auth page for EVzone Admin Portal
// Clean, enterprise style with real SSO provider icons

const EV = {
  green: "#03CD8C",
  orange: "#F77F00",
  wheat: "#FCE7C6",
  dark: "#0f172a",
  grayBorder: "#e2e8f0",
  grayText: "#64748b",
  lightGray: "#f8fafc",
  white: "#ffffff",
};

const track = (e, p = {}) => console.debug("[track]", e, { ...p, ts: Date.now() });

// SVG Icons for SSO providers
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#F25022" d="M1 1h10v10H1z"/>
    <path fill="#00A4EF" d="M1 13h10v10H1z"/>
    <path fill="#7FBA00" d="M13 1h10v10H13z"/>
    <path fill="#FFB900" d="M13 13h10v10H13z"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const EVzoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill={EV.green}/>
    <path d="M14 7l-5 6h4l-3 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function AuthSignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state && location.state.from) ? location.state.from : "/admin/home";

  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [pwd, setPwd] = useState("");
  const [caps, setCaps] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 980 : false
  );

  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth < 980);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  const validateEmail = (val) =>
    /[^@\s]+@[^@\s]+\.[^@\s]+/.test(String(val).toLowerCase());

  const onEmailBlur = () => {
    setEmailErr(
      email && !validateEmail(email) ? "Please enter a valid email address" : ""
    );
  };

  const login = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!email || !pwd) {
      setLoginError("Email and password are required");
      return;
    }
    if (!validateEmail(email)) {
      setEmailErr("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const isValid = validateEmail(email) && pwd.length > 0;
    if (!isValid) {
      setLoginError("Invalid email or password. Please try again.");
      setIsLoading(false);
      return;
    }
    signIn({ name: "Admin", email, role: "Admin (simulated)" });
    track("auth_login", { email, remember });
    navigate(from, { replace: true });
  };

  const sso = (provider) => {
    track("auth_sso", { provider });
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(`${provider} SSO authentication (demo – connect to your identity provider)`);
    }, 500);
  };

  return (
    <div style={styles.page}>
      {/* LEFT HERO - Keep the existing image/visual */}
      {!isMobile && (
        <div style={styles.heroWrap}>
          <div style={styles.heroGradient} />
          <div style={styles.heroCenter}>
            <div style={{ ...styles.roundel, background: EV.orange }}>
              <div style={styles.centerFull}>
                <div style={{ position: "relative", width: 240, height: 240 }}>
                  {trolleySvg()}
                </div>
              </div>
              {iconRing()}
            </div>
          </div>
          <div style={styles.heroFooter}>
            <div style={styles.heroFooterContent}>
              <span style={styles.heroFooterBrand}>EVzone</span>
              <span style={styles.heroFooterText}>Rides Admin Portal</span>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT AUTH COLUMN - Redesigned */}
      <div style={styles.formCol}>
        {/* Top bar */}
        <div style={styles.topBar}>
          <div style={styles.logoContainer}>
            <div style={styles.logoDot} />
            <span style={styles.logoText}>EVzone</span>
          </div>
          <select style={styles.langSelect} defaultValue="en">
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="sw">Kiswahili</option>
            <option value="es">Español</option>
            <option value="pt">Português</option>
          </select>
        </div>

        <div style={styles.formContainer}>
          {/* Header */}
          <div style={styles.headerSection}>
            <h1 style={styles.mainTitle}>Welcome back</h1>
            <p style={styles.subtitle}>
              Sign in to access your admin dashboard and manage your fleet operations.
            </p>
          </div>

          {/* SSO Buttons */}
          <div style={styles.ssoSection}>
            <button style={styles.ssoButton} onClick={() => sso("Google")} disabled={isLoading}>
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
            <button style={styles.ssoButton} onClick={() => sso("Microsoft")} disabled={isLoading}>
              <MicrosoftIcon />
              <span>Continue with Microsoft</span>
            </button>
            <div style={styles.ssoRow}>
              <button style={styles.ssoButtonSmall} onClick={() => sso("Apple")} disabled={isLoading}>
                <AppleIcon />
                <span>Apple</span>
              </button>
              <button style={styles.ssoButtonSmall} onClick={() => sso("EVzone")} disabled={isLoading}>
                <EVzoneIcon />
                <span>EVzone Account</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>or continue with email</span>
            <div style={styles.dividerLine} />
          </div>

          {/* Email Form */}
          <form style={styles.form} onSubmit={login}>
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
                onBlur={onEmailBlur}
                placeholder="you@company.com"
                disabled={isLoading}
              />
              {emailErr && <span style={styles.errorText}>{emailErr}</span>}
            </div>

            <div style={styles.fieldGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Password</label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/admin/forgot-password");
                  }}
                  style={styles.forgotLink}
                >
                  Forgot password?
                </a>
              </div>
              <div style={styles.passwordWrapper}>
                <input
                  style={{ ...styles.input, paddingRight: 48 }}
                  type={showPwd ? "text" : "password"}
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  onKeyUp={(e) =>
                    setCaps(e.getModifierState && e.getModifierState("CapsLock"))
                  }
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  style={styles.eyeButton}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? eyeOffSvg() : eyeOpenSvg()}
                </button>
              </div>
              {caps && <span style={styles.warningText}>⚠️ Caps Lock is on</span>}
              {loginError && <span style={styles.errorText}>{loginError}</span>}
            </div>

            <div style={styles.rememberRow}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={styles.checkbox}
                />
                <span>Keep me signed in</span>
              </label>
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
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Footer */}
          <div style={styles.footerSection}>
            <p style={styles.footerText}>
              Protected by enterprise-grade security. By signing in, you agree to our{" "}
              <a href="#" style={styles.footerLink}>Terms of Service</a>
              {" "}and{" "}
              <a href="#" style={styles.footerLink}>Privacy Policy</a>.
            </p>
            <p style={styles.helpText}>
              Need help? <a href="#" style={styles.footerLink}>Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon helpers - keeping the existing hero visuals
function trolleySvg() {
  return (
    <svg
      width="240"
      height="240"
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <circle cx="120" cy="120" r="110" fill={EV.white} opacity="0.08" />
      <rect x="40" y="160" width="160" height="6" rx="3" fill={EV.white} opacity="0.3" />
      <rect x="60" y="110" width="120" height="40" rx="18" fill={EV.white} opacity="0.95" />
      <path
        d="M80 110L96 90h48l16 20"
        stroke={EV.white}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <circle cx="70" cy="132" r="5" fill={EV.orange} />
      <circle cx="170" cy="132" r="5" fill={EV.orange} />
      <circle cx="85" cy="160" r="13" fill={EV.dark} opacity="0.95" />
      <circle cx="155" cy="160" r="13" fill={EV.dark} opacity="0.95" />
      <circle cx="85" cy="160" r="6" fill={EV.white} opacity="0.9" />
      <circle cx="155" cy="160" r="6" fill={EV.white} opacity="0.9" />
      <path
        d="M122 118l-10 18h12l-8 16"
        stroke={EV.orange}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function eyeOpenSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5C7 5 3.3 8.1 2 12c1.3 3.9 5 7 10 7s8.7-3.1 10-7c-1.3-3.9-5-7-10-7Z"
        stroke="#64748b"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="3" stroke="#64748b" strokeWidth="1.5" />
    </svg>
  );
}

function eyeOffSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 3l18 18" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M12 5c-5 0-8.7 3.1-10 7 .5 1.5 1.4 2.9 2.5 4M12 19c5 0 8.7-3.1 10-7-.5-1.5-1.4-2.9-2.5-4"
        stroke="#64748b"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function iconRing() {
  const icons = ["🚗", "🚕", "🚙", "🚌", "🚎", "🚐", "🚚", "🚛", "🛵", "🚲", "🚦", "📦"];
  const size = 72;
  const font = 30;
  const r = 260;
  const cx = 280;
  const cy = 280;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {icons.map((ic, i) => {
        const angle = (i / icons.length) * Math.PI * 2;
        const x = cx + Math.cos(angle) * r - size / 2;
        const y = cy + Math.sin(angle) * r - size / 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: 9999,
              background: EV.white,
              color: EV.orange,
              display: "grid",
              placeItems: "center",
              boxShadow: "0 6px 20px rgba(0,0,0,.12)",
              fontSize: font,
            }}
          >
            {ic}
          </div>
        );
      })}
    </div>
  );
}

// Styles
const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: EV.white,
  },
  heroWrap: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  heroGradient: {
    position: "absolute",
    inset: 0,
    background: `radial-gradient(1400px 800px at -10% -20%, ${EV.wheat}, transparent 60%)`,
  },
  heroCenter: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
  },
  roundel: {
    width: 560,
    height: 560,
    borderRadius: 9999,
    position: "relative",
    boxShadow: "0 10px 40px rgba(0,0,0,.15)",
  },
  centerFull: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
  },
  heroFooter: {
    position: "absolute",
    bottom: 32,
    left: 32,
    background: "rgba(255,255,255,.95)",
    padding: "12px 20px",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,.08)",
  },
  heroFooterContent: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  heroFooterBrand: {
    fontWeight: 800,
    fontSize: 18,
    color: EV.dark,
  },
  heroFooterText: {
    color: EV.grayText,
    fontSize: 14,
  },
  formCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "24px 48px",
    maxWidth: 560,
    minWidth: 400,
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  logoDot: {
    width: 12,
    height: 12,
    borderRadius: 9999,
    background: EV.green,
  },
  logoText: {
    fontWeight: 700,
    fontSize: 18,
    color: EV.dark,
  },
  langSelect: {
    padding: "8px 12px",
    borderRadius: 8,
    border: `1px solid ${EV.grayBorder}`,
    fontSize: 13,
    color: EV.grayText,
    background: EV.white,
    cursor: "pointer",
    outline: "none",
  },
  formContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    maxWidth: 420,
  },
  headerSection: {
    marginBottom: 32,
  },
  mainTitle: {
    margin: 0,
    fontSize: 32,
    fontWeight: 700,
    color: EV.dark,
    letterSpacing: -0.5,
  },
  subtitle: {
    margin: "8px 0 0",
    fontSize: 15,
    color: EV.grayText,
    lineHeight: 1.5,
  },
  ssoSection: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 24,
  },
  ssoButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 10,
    border: `1px solid ${EV.grayBorder}`,
    background: EV.white,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    color: EV.dark,
    transition: "all 0.2s ease",
    ":hover": {
      background: EV.lightGray,
      borderColor: "#cbd5e1",
    },
  },
  ssoRow: {
    display: "flex",
    gap: 12,
  },
  ssoButtonSmall: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 10,
    border: `1px solid ${EV.grayBorder}`,
    background: EV.white,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    color: EV.dark,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: EV.grayBorder,
  },
  dividerText: {
    fontSize: 13,
    color: EV.grayText,
    whiteSpace: "nowrap",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: EV.dark,
  },
  forgotLink: {
    fontSize: 13,
    color: EV.green,
    textDecoration: "none",
    fontWeight: 500,
  },
  input: {
    padding: "12px 14px",
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
  warningText: {
    fontSize: 13,
    color: "#d97706",
    marginTop: 4,
  },
  rememberRow: {
    display: "flex",
    alignItems: "center",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: EV.grayText,
    cursor: "pointer",
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: EV.green,
    cursor: "pointer",
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
    marginTop: 8,
  },
  footerSection: {
    marginTop: 32,
    textAlign: "center",
  },
  footerText: {
    fontSize: 12,
    color: EV.grayText,
    lineHeight: 1.6,
    margin: 0,
  },
  footerLink: {
    color: EV.green,
    textDecoration: "none",
    fontWeight: 500,
  },
  helpText: {
    fontSize: 13,
    color: EV.grayText,
    marginTop: 12,
  },
};
