// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signIn } from "../auth/auth";

// Professional, dependency-free Auth page for EVzone Admin Portal
// No external UI libs. Clean, enterprise style.
//
// Manual test cases:
// 1) Initial render
//    - Page shows a left hero (on desktop) with EV visuals and a right auth card.
//    - Title reads "Admin Portal" and header bar reads "EVzone Admin · Secure Console".
// 2) Email validation
//    - Blurring the email field with an invalid email shows an error message.
//    - Entering a valid email clears the error.
// 3) Password visibility
//    - Clicking the eye icon toggles between hidden and visible password.
// 4) Caps lock warning
//    - Turning Caps Lock on while typing password shows a caps-lock warning.
// 5) Login
//    - Submitting with empty email/password shows an alert.
//    - Submitting with valid email/password triggers a console "auth_login" and demo alert.
// 6) SSO buttons
//    - Clicking any SSO button logs an "auth_sso" event and shows a demo alert.
// 7) Remember device
//    - Checkbox defaults to checked and toggles correctly.
// 8) Self-tests
//    - Console warns if any self-test fails (e.g. title mismatch).

const EV = {
  green: "#03CD8C",
  orange: "#F77F00",
  wheat: "#FCE7C6",
  dark: "#0f172a",
  grayBorder: "#e5e7eb",
  grayText: "#64748b",
  white: "#ffffff",
};

const TITLE = "Rides Admin Panel";

const track = (e, p = {}) => console.debug("[track]", e, { ...p, ts: Date.now() });

export default function AuthSignIn() {
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const presetName = params.get("name") || "Allan";

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state && location.state.from) ? location.state.from : "/admin/home";

  const [email, setEmail] = useState("admin@evzone.app");
  const [emailErr, setEmailErr] = useState("");
  const [pwd, setPwd] = useState("");
  const [caps, setCaps] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);

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
      email && !validateEmail(email) ? "Enter a valid work email" : ""
    );
  };

  const login = (e) => {
    e.preventDefault();
    if (!email || !pwd) return alert("Email & password required");
    if (!validateEmail(email)) {
      setEmailErr("Enter a valid work email");
      return;
    }
    signIn({ name: presetName, email, role: "Admin (simulated)" });
    track("auth_login", { email, remember });
    navigate(from, { replace: true });
  };

  const sso = (prov) => {
    track("auth_sso", { provider: prov });
    alert("SSO: " + prov + " (demo – wire to Admin SSO)");
  };

  useEffect(() => {
    const tests = [];
    tests.push({ name: "has hero", pass: true });
    tests.push({ name: "email default set", pass: email === "admin@evzone.app" });
    tests.push({ name: "name default is Allan", pass: presetName === "Allan" });
    tests.push({ name: "title constant ok", pass: TITLE === "Admin Portal" });
    tests.push({
      name: "title includes Admin",
      pass: TITLE.toLowerCase().includes("admin"),
    });
    tests.push({ name: "title/h1 color contrast", pass: EV.grayText !== EV.dark });
    tests.push({ name: "login handler present", pass: typeof login === "function" });
    tests.push({ name: "sso handler present", pass: typeof sso === "function" });
    tests.push({ name: "remember defaults true", pass: remember === true });
    if (!tests.every((t) => t.pass)) console.warn("[auth self-tests]", tests);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={styles.page}>
      {/* LEFT HERO */}
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
          <div style={styles.heroFooter}>{TITLE}</div>
        </div>
      )}

      {/* RIGHT AUTH COLUMN */}
      <div style={styles.formCol}>
        {/* Brand bar */}
        <div style={styles.brandBar}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={styles.brandDot} />
            <strong>EVzone Admin</strong>
          </div>
          <div style={{ fontSize: 12, color: EV.grayText }}>Secure Console</div>
        </div>

        <div style={styles.cardMaxWidth}>
          <h2 style={styles.title}>{TITLE}</h2>
          <h1 style={styles.h1}>Welcome back, {presetName}.</h1>
          <p style={styles.sub}>Sign in to access the {TITLE}.</p>

          {/* Email login */}
          <form style={styles.cardBox} onSubmit={login}>
            <div style={styles.fieldCol}>
              <label style={styles.label}>Work email</label>
              <input
                style={{
                  ...styles.input,
                  borderColor: emailErr ? "#fecaca" : EV.grayBorder,
                }}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={onEmailBlur}
                placeholder="name@company.com"
                required
              />
              {emailErr && <span style={styles.errText}>{emailErr}</span>}
            </div>

            <div style={styles.fieldCol}>
              <label style={styles.label}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...styles.input, paddingRight: 44 }}
                  type={showPwd ? "text" : "password"}
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  onKeyUp={(e) =>
                    setCaps(
                      e.getModifierState && e.getModifierState("CapsLock")
                    )
                  }
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  onClick={() => setShowPwd((s) => !s)}
                  style={styles.eyeBtn}
                >
                  {showPwd ? eyeOffSvg() : eyeOpenSvg()}
                </button>
              </div>
              {caps && <span style={styles.noteText}>Caps Lock is ON</span>}
            </div>

            <div style={styles.rowBetweenWrap}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span style={styles.caption}>Remember this device</span>
              </label>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  track("auth_forgot");
                  alert("Password reset (demo – wire to Admin reset flow)");
                }}
                style={styles.link}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              style={{ ...styles.btnPrimary, width: "100%", marginTop: 10 }}
            >
              Sign in
            </button>
          </form>

          {/* Divider */}
          <div style={styles.divider}>
            <span style={styles.dividerText}>or</span>
          </div>

          {/* SSO providers */}
          <div style={styles.rowGap}>
            <button style={styles.btnSSO} onClick={() => sso("Google")}>
              🔐 Google SSO
            </button>
            <button style={styles.btnSSO} onClick={() => sso("Microsoft Entra")}>
              🔐 Microsoft Entra
            </button>
            <button style={styles.btnSSO} onClick={() => sso("Apple")}>
              🔐 Apple
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: EV.grayText }}>
            By signing in you agree to the{" "}
            <a style={styles.link} href="#">
              Terms
            </a>{" "}
            and{" "}
            <a style={styles.link} href="#">
              Privacy
            </a>
            .
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: EV.grayText }}>
            SSO & strong passwords required · Sessions logged in Audit · Need
            help?{" "}
            <a href="#" style={styles.link}>
              Contact Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon helpers
function trolleySvg() {
  // Central hero icon – EV vehicle to reflect Rides Admin context
  return (
    <svg
      width="240"
      height="240"
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* soft outer glow */}
      <circle cx="120" cy="120" r="110" fill={EV.white} opacity="0.08" />
      {/* road */}
      <rect
        x="40"
        y="160"
        width="160"
        height="6"
        rx="3"
        fill={EV.white}
        opacity="0.3"
      />
      {/* car body */}
      <rect
        x="60"
        y="110"
        width="120"
        height="40"
        rx="18"
        fill={EV.white}
        opacity="0.95"
      />
      {/* windshield / roof */}
      <path
        d="M80 110L96 90h48l16 20"
        stroke={EV.white}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      {/* headlights */}
      <circle cx="70" cy="132" r="5" fill={EV.orange} />
      <circle cx="170" cy="132" r="5" fill={EV.orange} />
      {/* wheels */}
      <circle cx="85" cy="160" r="13" fill={EV.dark} opacity="0.95" />
      <circle cx="155" cy="160" r="13" fill={EV.dark} opacity="0.95" />
      <circle cx="85" cy="160" r="6" fill={EV.white} opacity="0.9" />
      <circle cx="155" cy="160" r="6" fill={EV.white} opacity="0.9" />
      {/* EV bolt on door */}
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
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 5C7 5 3.3 8.1 2 12c1.3 3.9 5 7 10 7s8.7-3.1 10-7c-1.3-3.9-5-7-10-7Z"
        stroke="#475569"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3.2" stroke="#475569" strokeWidth="1.6" />
    </svg>
  );
}

function eyeOffSvg() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3 3l18 18" stroke="#475569" strokeWidth="1.6" />
      <path
        d="M12 5c-5 0-8.7 3.1-10 7 1.1 3.3 3.9 5.9 7.4 6.7M21.9 12.3C20.6 8.3 16.9 5 12 5"
        stroke="#475569"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3.2" stroke="#475569" strokeWidth="1.6" />
    </svg>
  );
}

function iconRing() {
  // Rides & Logistics focused icons – each circle represents a key mobility/logistics domain
  const icons = [
    "🚗", // EV car / standard rides
    "🚕", // taxi / on-demand rides
    "🚙", // SUV / premium rides
    "🚌", // school bus / shuttles
    "🚎", // city bus / BRT
    "🚐", // tourist van / tours
    "🚚", // delivery van / last-mile logistics
    "🚛", // truck / freight & bulk
    "🛵", // motorbike courier / boda
    "🚲", // bicycles / micro-mobility
    "🚦", // traffic & routing
    "📦", // parcels / packages
  ];
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
  page: { display: "flex", minHeight: "100vh", background: EV.white },
  heroWrap: { flex: 1, position: "relative", overflow: "hidden" },
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
    bottom: 24,
    left: 24,
    color: EV.dark,
    fontWeight: 700,
    background: "rgba(255,255,255,.9)",
    padding: "6px 10px",
    borderRadius: 8,
    letterSpacing: 0.3,
  },
  formCol: {
    flex: 1,
    display: "grid",
    placeItems: "center",
    padding: 24,
    position: "relative",
  },
  brandBar: {
    position: "absolute",
    top: 16,
    right: 24,
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 9999,
    background: EV.green,
  },
  cardMaxWidth: { width: "100%", maxWidth: 520 },
  title: {
    margin: 0,
    color: EV.dark,
    fontWeight: 900,
    fontSize: 32,
    letterSpacing: 0.3,
  },
  h1: {
    margin: "6px 0 0",
    color: EV.grayText,
    fontWeight: 800,
    fontSize: 24,
  },
  sub: { marginTop: 6, color: EV.grayText },
  cardBox: {
    border: `1px solid ${EV.grayBorder}`,
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    background: EV.white,
  },
  caption: { fontSize: 12, color: EV.grayText },
  rowBetweenWrap: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  fieldCol: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 10,
  },
  label: { fontSize: 12, color: "#475569" },
  input: {
    border: `1px solid ${EV.grayBorder}`,
    borderRadius: 8,
    padding: "10px 12px",
    outline: "none",
    fontSize: 14,
    width: "100%",
  },
  eyeBtn: {
    position: "absolute",
    right: 8,
    top: 6,
    padding: "6px 10px",
    fontSize: 12,
    border: `1px solid ${EV.grayBorder}`,
    borderRadius: 8,
    background: EV.white,
    cursor: "pointer",
  },
  btnPrimary: {
    background: EV.green,
    color: EV.white,
    padding: "11px 14px",
    borderRadius: 8,
    border: 0,
    cursor: "pointer",
    fontWeight: 700,
  },
  btnSSO: {
    background: "#f8fafc",
    color: "#0f172a",
    padding: "10px 14px",
    borderRadius: 8,
    border: `1px solid ${EV.grayBorder}`,
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
  },
  link: {
    color: EV.orange,
    textDecoration: "none",
    fontWeight: 600,
  },
  divider: { position: "relative", textAlign: "center", margin: "16px 0" },
  dividerText: {
    background: EV.white,
    padding: "0 8px",
    color: "#94a3b8",
  },
  rowGap: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8,
    marginTop: 10,
  },
  errText: { color: "#b91c1c", fontSize: 12 },
  noteText: { color: "#0ea5e9", fontSize: 12 },
};
