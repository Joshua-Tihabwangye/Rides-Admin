import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import packageJson from "./package.json" with { type: "json" };
import { execSync } from "node:child_process";

const appVersion = packageJson.version;

function gitSha() {
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __GIT_SHA__: JSON.stringify(gitSha()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react()],
  resolve: {
    alias: [
      // Use the ESM builds of MUI icons so Vite does not wrap the CJS
      // default export in a broken namespace object (Rides-Admin would
      // otherwise render a blank page because every icon becomes an
      // invalid React element type).
      {
        find: /^@mui\/icons-material\/(.+)$/,
        replacement: "@mui/icons-material/esm/$1",
      },
      {
        find: /^@mui\/icons-material$/,
        replacement: "@mui/icons-material/esm/index.js",
      },
    ],
  },
  optimizeDeps: {
    // Keep development startup deterministic. With route modules imported
    // eagerly, discovering another shared MUI/Emotion chunk after the browser
    // starts can leave the mounted page using outdated optimized modules until
    // a manual refresh. This restores the known-good forced pre-bundle and
    // disables the follow-up discovery pass.
    force: true,
    noDiscovery: true,
    include: [
      "react",
      "react-dom/client",
      "react-router-dom",
      "@emotion/react",
      "@emotion/styled",
      "@mui/material",
      "@mui/icons-material",
      "@mui/x-date-pickers/AdapterDayjs",
      "@mui/x-date-pickers/DatePicker",
      "@mui/x-date-pickers/LocalizationProvider",
      "@react-google-maps/api",
      "dayjs",
      "recharts",
      "socket.io-client",
    ],
  },
  server: {
    port: 5176,
    strictPort: true,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5176,
      clientPort: 5176,
    },
  },
});
